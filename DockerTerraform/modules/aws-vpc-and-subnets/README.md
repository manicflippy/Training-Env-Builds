# AWS VPC and Subnets Terraform Module

This module creates a complete AWS VPC infrastructure with public and private subnets distributed across multiple availability zones, along with the necessary routing components.

## Features

- Creates a VPC with customizable CIDR block
- Dynamically creates public and private subnets across available Availability Zones
- Sets up an Internet Gateway for public internet access
- Configures a NAT Gateway for private subnet internet access
- Creates appropriate route tables for both public and private subnets
- Automatically assigns public IPs to instances in public subnets

## Usage

```hcl
module "vpc" {
  source = "./modules/aws-vpc-and-subnets"

  vpc_cidr   = "10.0.0.0/16"
  vpc_name   = "my-application-vpc"
  aws_region = "us-east-1"
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 0.13.0 |
| aws | >= 3.0.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| vpc_cidr | The CIDR block for the VPC | `string` | `null` | yes |
| vpc_name | The name of the VPC | `string` | `null` | yes |
| aws_region | The AWS region to deploy the VPC in | `string` | `null` | yes |
| private_subnets | Map of private subnet names to numbers (used for CIDR calculation) | `map(number)` | `{"private_subnet_1"=1, "private_subnet_2"=2, "private_subnet_3"=3, "private_subnet_4"=4}` | no |
| public_subnets | Map of public subnet names to numbers (used for CIDR calculation) | `map(number)` | `{"public_subnet_1"=1, "public_subnet_2"=2, "public_subnet_3"=3, "public_subnet_4"=4}` | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_information | A formatted string with VPC information including environment and ID |
| vpc_id | The ID of the created VPC |
| public_subnet_ids | List of IDs of the public subnets |
| private_subnet_ids | List of IDs of the private subnets |

## Example: Complete VPC with EC2 Instance

```hcl
provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source = "./modules/aws-vpc-and-subnets"

  vpc_cidr   = "10.0.0.0/16"
  vpc_name   = "production-vpc"
  aws_region = "us-west-2"
}

resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = module.vpc.public_subnet_ids[0]
  
  tags = {
    Name = "WebServer"
  }
}
```

## Architecture

This module creates the following resources:

1. **VPC**: A virtual network dedicated to your AWS account
2. **Public Subnets**: Subnets with direct internet access via an Internet Gateway
3. **Private Subnets**: Subnets with outbound-only internet access via a NAT Gateway
4. **Internet Gateway**: Enables communication between VPC and the internet
5. **NAT Gateway**: Allows private subnet resources to access the internet while remaining private
6. **Route Tables**: Defines rules for directing network traffic
7. **Route Table Associations**: Links subnets to the appropriate route tables

## CIDR Block Allocation

The module automatically calculates CIDR blocks for subnets based on the VPC CIDR block:

- Private subnets use the pattern: `cidrsubnet(vpc_cidr, 8, subnet_number)`
- Public subnets use the pattern: `cidrsubnet(vpc_cidr, 8, subnet_number + 100)`

This ensures there are no CIDR block conflicts between public and private subnets.

## Notes

- The module creates subnets in all available Availability Zones in the specified region
- By default, instances launched in public subnets will receive public IP addresses
- The NAT Gateway is deployed in the first public subnet (`public_subnet_1`)
- All resources are tagged with `Terraform = "true"` for easier identification

## License

MIT