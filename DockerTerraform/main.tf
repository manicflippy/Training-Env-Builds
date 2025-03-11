provider "aws" {
  region = var.region # Change to your preferred AWS region
  default_tags {
    tags = {
      Environment = local.environment
      Terraform   = "Yes"
      Project     = "${local.application} Infrastructure"
      Application = local.application
    }
  }
}

#Retrieve the list of AZs in the current AWS region
data "aws_availability_zones" "available" {}
data "aws_region" "current" {}
data "http" "my_ip" {
  url = "https://ifconfig.io"
}

locals {
  team        = "Training"
  application = "docker"
  server_name = "ec2-${local.environment}}"
  my_ip       = trimsuffix(data.http.my_ip.response_body, "\n")
  environment = terraform.workspace
}


# Generate a new private key
resource "tls_private_key" "ubuntu_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Save private key locally
resource "local_file" "private_key" {
  content  = tls_private_key.ubuntu_key.private_key_pem
  filename = "${path.module}/ubuntu-key.pem"

  # Set appropriate permissions on Windows
  provisioner "local-exec" {
    command = <<-EOT
      for /f "tokens=*" %i in ('whoami') do (
        icacls.exe "${path.module}/ubuntu-key.pem" /inheritance:r /remove "NT AUTHORITY\\Authenticated Users" /grant:r "%i:(R,W)"
      )
    EOT
  }
}

# Create a key pair for SSH access using the generated key
resource "aws_key_pair" "ubuntu_key" {
  key_name   = "ubuntu-key"
  public_key = tls_private_key.ubuntu_key.public_key_openssh
}

module "aws-vpc-and-subnets" {
  source = "./modules/aws-vpc-and-subnets"

  # Required parameters
  vpc_cidr   = "10.0.0.0/16"
  vpc_name   = "${local.environment}_test_vpc"
  aws_region = var.region

}

# Create a Docker Swarm security group using the security group module
module "docker_swarm_sg" {
  source = "./modules/aws-security-groups"

  security_group_name        = "${local.environment}-docker-swarm-sg"
  security_group_description = "Security group for Docker Swarm cluster"
  vpc_id                     = module.aws-vpc-and-subnets.vpc_id
  
  ingress_rules = [
    # SSH access
    {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["${local.my_ip}/32"]
      description = "SSH access"
    },
    # HTTP access
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP access"
    },
    # HTTPS access
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS access"
    },
    # Docker Swarm cluster management
    {
      from_port   = 2377
      to_port     = 2377
      protocol    = "tcp"
      self        = true
      description = "Docker Swarm cluster management"
    },
    # Docker container network discovery (TCP)
    {
      from_port   = 7946
      to_port     = 7946
      protocol    = "tcp"
      self        = true
      description = "Docker container network discovery (TCP)"
    },
    # Docker container network discovery (UDP)
    {
      from_port   = 7946
      to_port     = 7946
      protocol    = "udp"
      self        = true
      description = "Docker container network discovery (UDP)"
    },
    # Overlay network traffic
    {
      from_port   = 4789
      to_port     = 4789
      protocol    = "udp"
      self        = true
      description = "Overlay network traffic"
    },
    # ICMP (ping) between nodes
    {
      from_port   = -1
      to_port     = -1
      protocol    = "icmp"
      self        = true
      description = "ICMP (ping) between nodes"
    }
  ]

  tags = {
    Environment = local.environment
    Terraform   = "Yes"
    Project     = "${local.application} Infrastructure"
    Application = local.application
  }
}

module "ubuntu_docker" {
  count  = var.server_count
  source = "./modules/aws-ubuntu-install"

  # Required parameters
  key_name         = aws_key_pair.ubuntu_key.key_name
  private_key_path = local_file.private_key.filename
  vpc_id           = module.aws-vpc-and-subnets.vpc_id
  subnet_id        = module.aws-vpc-and-subnets.public_subnet_ids[0]
  # Pass the security group ID from the security group module
  security_group_id = module.docker_swarm_sg.security_group_id
  # Set to empty string to prevent module from creating its own security group
  security_group_name = ""

  # Optional parameters with defaults
  region        = var.region
  name_prefix   = "${local.environment}-ubuntu-${local.application}-${count.index + 1}"
  instance_type = "t2.medium"
  ssh_cidr_blocks = [
    "${local.my_ip}/32"
  ]
  installation_script = "scripts/install_${local.application}.sh"


# Docker installation options
  install_docker     = true
  use_github_scripts = false

  # Uncomment and modify these if using GitHub scripts
  # github_repo_url   = "https://github.com/yourusername/your-repo.git"
  # github_repo_path  = "/home/ubuntu/setup"
  # github_script_path = "setup-docker.sh"


}
# Output the public IPs of all instances
output "server_public_ips" {
  value = {
    for idx, server in module.ubuntu_docker :
    "server_${idx + 1}" => server.public_ip
  }
}

# Output the SSH connection commands for all instances
output "ssh_connections" {
  value = {
    for idx, server in module.ubuntu_docker :
    "server_${idx + 1}" => server.ssh_command
  }
}

# When server_count = 1
output "server_public_ip" {
  value = var.server_count > 0 ? module.ubuntu_docker[0].public_ip : null
}

output "ssh_connection" {
  value = var.server_count > 0 ? module.ubuntu_docker[0].ssh_command : null
}