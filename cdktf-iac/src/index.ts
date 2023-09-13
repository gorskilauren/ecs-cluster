require('dotenv').config()
import { App } from "cdktf";
import { EcsClusterStack } from './EcsClusterStack';
import { cicdConfig } from "../config/cicd";
import { localConfig } from "../config/local";
import { BudgetsStack } from "./BudgetsStack";

let config;
switch (`${process.env.NODE_ENV}`.toLowerCase()) {
    case 'cicd':
        config = cicdConfig
        break;
    case 'local':
        config = localConfig
        break;
    default:
        throw new Error(`Invalid node env provided ${process.env.NODE_ENV}`)
}

const app = new App();

new BudgetsStack(app, "BudgetsStack",
    {
        accountId: `${process.env.ACCOUNT_ID}`,
        accountAlias: `${process.env.ACCOUNT_ALIAS}`,
        backendBucket: `${process.env.BACKEND_S3_BUCKET}`,
        emailToNotify: `${process.env.EMAIL_TO_NOTIFY}`,
        config
    });

new EcsClusterStack(app, "EcsClusterStack",
    {
        accountId: `${process.env.ACCOUNT_ID}`,
        accountAlias: `${process.env.ACCOUNT_ALIAS}`,
        backendBucket: `${process.env.BACKEND_S3_BUCKET}`,
        config
    });

app.synth();
