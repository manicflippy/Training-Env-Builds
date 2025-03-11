# AWS Ubuntu Docker Terraform Configuration

This project demonstrates how to deploy one or more Ubuntu servers on AWS and install Docker using Terraform.

## Project Structure

- `main.tf` - Main Terraform configuration file that calls the module
- `modules/aws-ubuntu-docker/` - Reusable module for Ubuntu Docker server deployment
  - `main.tf` - Core module resources
  - `variables.tf` - Input variables for the module
  - `outputs.tf` - Output values from the module
  - `README.md` - Module documentation

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed
2. AWS CLI configured with appropriate credentials
3. SSH key pair for server access

## SSH Key Setup

Before applying the Terraform configuration, you need to create an SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -f ubuntu-key
```

This will generate:
- `ubuntu-key` (private key)
- `ubuntu-key.pub` (public key)

Make sure both files are in the same directory as your Terraform configuration.

## Usage

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the planned changes:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

4. To destroy the infrastructure when done:
   ```bash
   terraform destroy
   ```

### Deploying Multiple Servers

You can deploy multiple Docker servers by setting the `server_count` variable:

```bash
# Deploy 3 servers
terraform apply -var="server_count=3"
```

Or by adding it to your `terraform.tfvars` file:

```hcl
server_count = 3
```

When multiple servers are deployed:
- Each server will have a unique name (e.g., dev-ubuntu-docker-1, dev-ubuntu-docker-2)
- The output will include:
  - A map of all server public IPs with keys like "server_1", "server_2", etc.
  - A map of all SSH connection commands for each server
  - The original single-server outputs for backward compatibility

## Configuration Options

The main configuration file (`main.tf`) allows you to customize:

- AWS region
- Number of servers to deploy (`server_count`)
- Instance type
- Security group settings
- Docker installation method (direct or via GitHub)
- Resource tags

For more detailed configuration options, see the module's README file.

## Module vs. Monolithic Approach

This project uses a modular approach, which offers several advantages:

- **Reusability**: The module can be used across multiple projects
- **Maintainability**: Changes to the Docker installation process only need to be made in one place
- **Parameterization**: Easy customization of deployment options
- **Encapsulation**: Implementation details are hidden from the main configuration
- **Scalability**: Easily deploy multiple servers with unique names

If you prefer a monolithic approach, you can find the original non-modular configuration in the `aws_ubuntu_docker.tf` file.
