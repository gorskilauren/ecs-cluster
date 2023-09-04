import { Config } from ".";

export const localConfig: Config = {
    s3Backend: {
        profile: process.env.ACCOUNT_ID
    },
    rootAwsProfile: {
        profile: process.env.ACCOUNT_ID
    }
}