# Training Environment Builds

This repository contains infrastructure-as-code and configuration scripts for setting up various training and lab environments. The modular design allows for reuse of components across different projects and environments.

## Repository Structure

### DockerTerraform

A modular Terraform configuration for deploying Docker Swarm clusters on AWS. This project demonstrates how to create a highly modular and reusable infrastructure for Docker environments.

- **Key Features**:
  - Multi-server deployment with a single configuration
  - Shared security group for Docker Swarm communication
  - Modular design with reusable components
  - Automatic Docker installation on Ubuntu servers

[View DockerTerraform Documentation](./DockerTerraform/README.md)

### DockerFiles

Collection of Dockerfile templates and Docker Compose configurations for various applications and services.

- **example-ubuntu-nginx**: Example Dockerfile for an Ubuntu-based Nginx server

### AWS Creds Setup

Scripts and configurations for setting up and managing AWS credentials securely.

## Modular Architecture

This repository follows a highly modular approach to infrastructure code:

1. **Reusable Modules**: Each component is designed as a standalone module that can be used across different projects
2. **Clear Separation of Concerns**: Each module has a single responsibility
3. **DRY Principles**: Common configurations are extracted into shared modules to avoid duplication
4. **Parameterization**: Modules accept parameters to customize behavior without changing the module code

## Getting Started

1. Clone this repository
2. Navigate to the project directory of interest
3. Follow the README instructions for the specific project

## Best Practices

The code in this repository follows these best practices:

- **Security**: Restricted access through security groups and least privilege principles
- **Modularity**: Highly modular design for maximum reusability
- **Documentation**: Comprehensive README files for each component
- **Consistency**: Standardized naming conventions and code structure
- **Error Handling**: Robust error handling and troubleshooting guidance

## Contributing

When contributing to this repository, please follow these guidelines:

1. Maintain the modular architecture
2. Include comprehensive documentation
3. Follow existing naming conventions and code style
4. Test thoroughly before submitting changes

## License

MIT
