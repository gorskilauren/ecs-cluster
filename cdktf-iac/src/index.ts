require('dotenv').config()
import { App } from "cdktf";
import { EcsClusterStack } from './EcsClusterStack';

const app = new App();
new EcsClusterStack(app, "EcsClusterStack",
    {
        accountId: `${process.env.ACCOUNT_ID}`,
        accountAlias: `${process.env.ACCOUNT_ALIAS}`,
        backendBucket: `${process.env.BACKEND_S3_BUCKET}`
    });
app.synth();
