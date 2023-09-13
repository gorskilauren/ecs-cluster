import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { Config } from "../config";
import { BudgetsBudget } from "@cdktf/provider-aws/lib/budgets-budget";
import { BudgetsBudgetAction } from "@cdktf/provider-aws/lib/budgets-budget-action";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

interface BudgetsStackProps {
    accountAlias: string,
    backendBucket: string,
    emailToNotify: string,
    config: Config,
    accountId: string
}

export class BudgetsStack extends TerraformStack {
    constructor(scope: Construct, id: string, props: BudgetsStackProps) {
        super(scope, id);

        const awsManagedBudgetPolicy = 'arn:aws:iam::aws:policy/AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM'

        const provider = new AwsProvider(this, 'aws_provider', {
            allowedAccountIds: [props.accountId],
            region: 'us-west-2',
            alias: 'aws-provider',
            ...props.config.rootAwsProfile
        });

        new S3Backend(this, {
            bucket: props.backendBucket,
            key: id,
            region: 'us-west-2',
            encrypt: true,
            ...props.config.s3Backend
        });

        const resourceNames = this.createResourceNames(props.accountAlias);

        const assumeRolePolicy: DataAwsIamPolicyDocument = new DataAwsIamPolicyDocument(this,
            resourceNames.actionRoleAssumeRolePolicyDoc,
            {
                provider,
                statement: [{
                    effect: 'Allow',
                    principals: [{ type: "Service", identifiers: ["budgets.amazonaws.com"] }],
                    actions: ["sts:AssumeRole"]
                }]
            });

        const budgetRole = new IamRole(this, resourceNames.actionRole, {
            provider,
            name: 'budget-role',
            managedPolicyArns: [awsManagedBudgetPolicy],
            assumeRolePolicy: assumeRolePolicy.json
        });

        const budget = new BudgetsBudget(this, resourceNames.budget, {
            provider,
            name: 'Budget - Monthly',
            budgetType: 'COST',
            limitAmount: '100',
            limitUnit: 'USD',
            timeUnit: 'ANNUALLY'
        });

        new BudgetsBudgetAction(this, resourceNames.action, {
            provider,
            definition: {
                iamActionDefinition: {
                    policyArn: awsManagedBudgetPolicy,
                    roles: [budgetRole.arn]
                }
            },
            budgetName: budget.name,
            actionThreshold: {
                actionThresholdType: 'PERCENTAGE',
                actionThresholdValue: 80
            },
            subscriber: [{
                address: props.emailToNotify,
                subscriptionType: 'EMAIL'
            }],
            actionType: 'APPLY_IAM_POLICY',
            approvalModel: 'AUTOMATIC',
            notificationType: 'ACTUAL',
            executionRoleArn: budgetRole.arn
        });


    }
    private createResourceNames = (accountAlias: string) => ({
        budget: `${accountAlias}_budget`,
        action: `${accountAlias}_budget_action`,
        actionRole: `${accountAlias}_budget_action_role`,
        actionRoleAssumeRolePolicyDoc: `${accountAlias}_budget_action_role_assume_role_doc`
    })
}