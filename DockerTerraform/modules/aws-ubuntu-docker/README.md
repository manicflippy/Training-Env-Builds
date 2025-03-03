# AWS Ubuntu Docker Module

This Terraform module deploys an Ubuntu server on AWS and installs Docker using SSH remote provisioner.

## Features

- Creates an EC2 instance with Ubuntu
- Sets up a security group with SSH, HTTP, and HTTPS access
- Installs Docker and Docker Compose
- Supports two installation methods:
  - Direct installation via inline commands
  - Pulling setup scripts from GitHub

## Usage

```hcl
module "ubuntu_docker" {
  source = "./modules/aws-ubuntu-docker"

  # Required parameters
  key_name         = aws_key_pair.ubuntu_key.key_name
  private_key_path = "${path.module}/ubuntu-key"

  # Optional parameters with defaults
  region           = "us-west-2"
  name_prefix      = "prod-ubuntu-docker"
  instance_type    = "t2.micro"
  ssh_cidr_blocks  = ["0.0.0.0/0"]  # Consider restricting to your IP for production
  
  # Docker installation options
  install_docker    = true
  use_github_scripts = false
  
  # Uncomment and modify these if using GitHub scripts
  # github_repo_url   = "https://github.com/yourusername/your-repo.git"
  # github_repo_path  = "/home/ubuntu/setup"
  # github_script_path = "setup-docker.sh"
  
  tags = {
    Environment = "Production"
    Project     = "Docker Infrastructure"
  }
}
```

## Requirements

- AWS provider
- SSH key pair for server access

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| region | AWS region to deploy resources | `string` | `"us-west-2"` | no |
| name_prefix | Prefix to use for resource names | `string` | `"ubuntu-docker"` | no |
| ami_id | AMI ID for Ubuntu server | `string` | `"ami-0c65adc9a5c1b5d7c"` | no |
| instance_type | EC2 instance type | `string` | `"t2.micro"` | no |
| key_name | Name of the AWS key pair to use for SSH access | `string` | n/a | yes |
| private_key_path | Path to the private key file for SSH access | `string` | n/a | yes |
| vpc_id | ID of the VPC to deploy resources | `string` | `null` | no |
| subnet_id | ID of the subnet to deploy the EC2 instance | `string` | `null` | no |
| security_group_name | Name for the security group | `string` | `"ubuntu-docker-sg"` | no |
| ssh_username | Username for SSH access | `string` | `"ubuntu"` | no |
| ssh_cidr_blocks | CIDR blocks for SSH access | `list(string)` | `["0.0.0.0/0"]` | no |
| http_cidr_blocks | CIDR blocks for HTTP access | `list(string)` | `["0.0.0.0/0"]` | no |
| https_cidr_blocks | CIDR blocks for HTTPS access | `list(string)` | `["0.0.0.0/0"]` | no |
| tags | Tags to apply to all resources | `map(string)` | `{}` | no |
| install_docker | Whether to install Docker directly via remote-exec | `bool` | `true` | no |
| use_github_scripts | Whether to use GitHub scripts for setup | `bool` | `false` | no |
| github_repo_url | URL of the GitHub repository containing setup scripts | `string` | `""` | no |
| github_repo_path | Path where to clone the GitHub repository | `string` | `"/home/ubuntu/setup"` | no |
| github_script_path | Path to the setup script within the GitHub repository | `string` | `"setup-docker.sh"` | no |

## Outputs

| Name | Description |
|------|-------------|
| instance_id | ID of the EC2 instance |
| public_ip | Public IP address of the EC2 instance |
| private_ip | Private IP address of the EC2 instance |
| security_group_id | ID of the security group |
| ssh_command | SSH command to connect to the instance |

## License

MIT