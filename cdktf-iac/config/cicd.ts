import { Config } from ".";

export const cicdConfig: Config = {
    s3Backend: {
        roleArn: process.env.TERRAFORM_ROLE
    },
    rootAwsProfile: {
        roleToAssume: process.env.TERRAFORM_ROLE
    }
}