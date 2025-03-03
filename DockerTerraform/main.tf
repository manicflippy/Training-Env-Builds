provider "aws" {
  region = "us-west-2" # Change to your preferred AWS region
}

#Retrieve the list of AZs in the current AWS region
data "aws_availability_zones" "available" {}
data "aws_region" "current" {}

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
  vpc_name   = "jp_test_vpc"
  aws_region = "us-east-1"

}

module "ubuntu_docker" {
  source = "./modules/aws-ubuntu-docker"

  # Required parameters
  key_name         = aws_key_pair.ubuntu_key.key_name
  private_key_path = local_file.private_key.filename
  vpc_id           = module.aws-vpc-and-subnets.vpc_id
  subnet_id        = module.aws-vpc-and-subnets.public_subnet_ids[0]
  
  # Optional parameters with defaults
  region          = "us-west-2"
  name_prefix     = "prod-ubuntu-docker"
  instance_type   = "t2.micro"
  ssh_cidr_blocks = ["0.0.0.0/0"] # Consider restricting to your IP for production

  # Docker installation options
  install_docker     = true
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

# Output the public IP of the instance
output "server_public_ip" {
  value = module.ubuntu_docker.public_ip
}

# Output the SSH connection command
output "ssh_connection" {
  value = module.ubuntu_docker.ssh_command
}
