# DockerTerraform Infrastructure Diagram

The following diagram illustrates the Terraform structure and resources deployed in this project.

```mermaid
graph TD
    %% Main Module
    Main[Main Module] --> TLS[tls_private_key.ubuntu_key]
    Main --> LocalFile[local_file.private_key]
    Main --> KeyPair[aws_key_pair.ubuntu_key]
    Main --> VPCModule[Module: aws-vpc-and-subnets]
    Main --> SGModule[Module: aws-security-groups]
    Main --> DockerModule[Module: aws-ubuntu-install]
    
    %% VPC Module
    subgraph VPC[Module: aws-vpc-and-subnets]
        VPC1[aws_vpc.vpc] --> IGW[aws_internet_gateway.internet_gateway]
        VPC1 --> PublicSubnets[aws_subnet.public_subnets]
        VPC1 --> PrivateSubnets[aws_subnet.private_subnets]
        IGW --> PublicRT[aws_route_table.public_route_table]
        PublicSubnets --> PublicRTA[aws_route_table_association.public]
        PublicRT --> PublicRTA
        VPC1 --> EIP[aws_eip.nat_gateway_eip]
        EIP --> NAT[aws_nat_gateway.nat_gateway]
        PublicSubnets --> NAT
        NAT --> PrivateRT[aws_route_table.private_route_table]
        PrivateSubnets --> PrivateRTA[aws_route_table_association.private]
        PrivateRT --> PrivateRTA
    end
    
    %% Security Group Module
    subgraph SecurityGroup[Module: aws-security-groups]
        SG[aws_security_group.security_group]
        SG --> SGIngress[Dynamic Ingress Rules]
        SG --> SGEgress[Egress Rules]
    end
    
    %% Ubuntu Docker Module
    subgraph UbuntuDocker[Module: aws-ubuntu-install]
        EC2[aws_instance.ubuntu_server]
        EC2 --> NullResource[null_resource.script_execution]
        NullResource --> FileProvisioner[File Provisioner]
        NullResource --> RemoteExec[Remote-Exec Provisioner]
    end
    
    %% Resource Relationships
    VPCModule --> SGModule
    VPCModule --> DockerModule
    SGModule --> DockerModule
    TLS --> LocalFile
    TLS --> KeyPair
    KeyPair --> DockerModule
    LocalFile --> DockerModule
    
    %% Docker Installation Script
    DockerModule --> DockerScript[install_docker.sh]
    DockerScript --> DockerEngine[Docker Engine]
    DockerScript --> DockerCompose[Docker Compose]
    DockerScript --> UserPermissions[Docker User Permissions]
```

## Resource Deployment Overview

### Root Module Resources
- **TLS Private Key**: Creates RSA key for SSH access
- **Local File**: Saves private key to local filesystem with proper permissions
- **AWS Key Pair**: Registers the public key with AWS for EC2 instance access

### VPC and Networking (aws-vpc-and-subnets)
- **VPC**: Creates a Virtual Private Cloud with specified CIDR block
- **Public Subnets**: Creates subnets with public IP mapping across availability zones
- **Private Subnets**: Creates private subnets across availability zones
- **Internet Gateway**: Provides internet access for the VPC
- **NAT Gateway**: Allows private subnet resources to access the internet
- **Route Tables**: Configures routing for public and private subnets

### Security (aws-security-groups)
- **Security Group**: Defines inbound and outbound traffic rules
- **Ingress Rules**: Configures allowed inbound traffic (SSH, HTTP, HTTPS, Docker Swarm ports)
- **Egress Rules**: Allows all outbound traffic

### EC2 Instances (aws-ubuntu-install)
- **EC2 Instance**: Deploys Ubuntu server instances
- **Provisioners**: Configures instances with Docker using remote-exec
- **Docker Installation**: Installs Docker Engine and Docker Compose
- **User Permissions**: Configures proper Docker access permissions
