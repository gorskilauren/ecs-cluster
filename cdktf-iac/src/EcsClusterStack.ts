import { Construct } from "constructs";
import { S3Backend, TerraformStack } from "cdktf";
import { Vpc } from '../.gen/modules/vpc';
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Config } from "../config";

interface EcsClusterStackProps {
  accountId: string,
  accountAlias: string,
  backendBucket: string,
  config: Config
}

export class EcsClusterStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: EcsClusterStackProps) {
    super(scope, id);

    new S3Backend(this, {
      bucket: props.backendBucket,
      key: id,
      region: 'us-west-2',
      encrypt: true,
      ...props.config.s3Backend
    });
    
    
    const resourceNames = this.createResourceNames(props.accountAlias)
    new AwsProvider(this, resourceNames.provider, {
      allowedAccountIds: [props.accountId],
      region: 'us-west-2',
      alias: resourceNames.provider,
      ...props.config.rootAwsProfile
    }); 

    const vpc = new Vpc(this, resourceNames.vpcModule, {
      azs: ["us-west-2a", "us-west-2b", "us-west-2c"],
      name: resourceNames.vpcModule,
      cidr: '10.11.0.0/16',
      privateSubnets: ['0', '1', '2'].map((thirdOctet: string) => `10.11.${thirdOctet}.0/24`),
      // singleNatGateway: true,
      // enableNatGateway: true
      //TODO enable these to access internet from vpc (but not vica versa) - costs $$
    });

    vpc.overrideLogicalId(resourceNames.vpcModule)
  }

  private createResourceNames = (namePrefix: string) => ({
    vpcModule: `${namePrefix}_private_vpc`,
    provider: `${namePrefix}_provider`
  });
}
