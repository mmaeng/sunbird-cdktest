import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ConfigProps } from "./config";

import {
  GatewayVpcEndpointAwsService,
} from "aws-cdk-lib/aws-ec2";


export interface VpcStackProps extends cdk.StackProps {
  config: ConfigProps;
}

export class vpcStack extends cdk.Stack {

  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const cidr = props.config.CIDR;

    this.vpc = new ec2.Vpc(this, "sbrc", {
      maxAzs: 2, // Use 2 Availability Zones
      ipAddresses: ec2.IpAddresses.cidr(cidr),
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24, //can be configurable
          name: "public-",
          subnetType: ec2.SubnetType.PUBLIC,
        },

        {
          cidrMask: 24, //can be configurable
          name: "app-pvt-",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },

        {
          cidrMask: 24, //can be configurable
          name: "db-pvt-",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],

      gatewayEndpoints: {
        S3: {
          service: GatewayVpcEndpointAwsService.S3,
        },
      },
    });

  }
}
