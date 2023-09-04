export interface Config {
    s3Backend: {
        roleArn?: string,
        profile?: string
    },
    rootAwsProfile: {
        roleToAssume?: string,
        profile?: string
    }
}