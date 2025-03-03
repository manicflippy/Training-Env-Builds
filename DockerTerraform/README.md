# AWS Ubuntu Docker Terraform Configuration

This project demonstrates how to deploy an Ubuntu server on AWS and install Docker using Terraform.

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

## Configuration Options

The main configuration file (`main.tf`) allows you to customize:

- AWS region
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

If you prefer a monolithic approach, you can find the original non-modular configuration in the `aws_ubuntu_docker.tf` file.
