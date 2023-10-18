import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import * as iam from "aws-cdk-lib/aws-iam";
import * as helm from "aws-cdk-lib/aws-eks";

export interface EKSStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class eksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EKSStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    const eksCluster = new eks.Cluster(this, "HelloEKS", {
      version: eks.KubernetesVersion.V1_27,
      defaultCapacity: 1,
      vpc: vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      kubectlLayer: new KubectlV27Layer(this, "kubectlLayer"),
    });

    eksCluster.addNodegroupCapacity('custom-node-group', {
      minSize: 1,
      diskSize: 100,
      maxSize: 2,
    });

    const awsAuth = new eks.AwsAuth(this, "AwsAuth", {
      cluster: eksCluster,
    });

    const adminRole = iam.Role.fromRoleName(this, "AdminRole", "Admin");
    awsAuth.addMastersRole(adminRole);

    new helm.HelmChart(this, "testing-Helm", {
      cluster: eksCluster,
      chart: 'wordpress',
      repository: 'https://charts.bitnami.com/bitnami',
      namespace: 'wordpress',
      release: 'wp-demo',
      values: {
        wordpressBlogName: "My demo blog",
        wordpressFirstName: "Testing",
        wordpressLastName: "LastName",
        wordpressUsername: "demo",
        wordpressPassword: "Welc0me",
      },
    });

  }
}
