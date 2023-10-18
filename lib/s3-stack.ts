import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";

export interface S3StackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class s3Stack extends cdk.Stack {
  private vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, "VpcId", {
      value: props.vpc.vpcId,
    });

    // Create an IAM user
    const user = new iam.User(this, "MyUser", {
      userName: "sbrc-minio", // Replace with your desired username
    });
    user.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    // Create an IAM access key for the user
    const accessKey = new iam.CfnAccessKey(this, "MyAccessKey", {
      userName: user.userName,
    });

    new cdk.CfnOutput(this, "AccessKey", {
      value: accessKey.attrSecretAccessKey,
    });
    new cdk.CfnOutput(this, "AccessKeyId", {
      value: accessKey.ref,
    });

    // Output the User ARN
    const userArnOutput = new cdk.CfnOutput(this, "UserArn", {
      description: "IAM User ARN",
      value: user.userArn,
      exportName: `${cdk.Aws.STACK_NAME}-UserArn`,
    });

    const myBucket = new s3.Bucket(this, "MyBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for demo purposes; change to the appropriate removal policy
      bucketName: "sbrc-registry-18-testing",
    });

    // Define an IAM policy statement that allows PutObject
    const putStatement = new iam.PolicyStatement({
      actions: ["s3:PutObject"],
      resources: [`${myBucket.bucketArn}/*`],
    });

    // Define an IAM policy statement that denies DeleteObject
    const denyDeleteStatement = new iam.PolicyStatement({
      actions: ["s3:DeleteObject"],
      resources: [`${myBucket.bucketArn}/*`],
      effect: iam.Effect.DENY,
    });

    // Create an IAM policy with both statements
    const bucketPolicy = new iam.Policy(this, "BucketPolicy", {
      statements: [putStatement, denyDeleteStatement],
    });

    // Attach the policy to the S3 bucket
    myBucket.grantReadWrite(bucketPolicy);
  }
}
