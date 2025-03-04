variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "name_prefix" {
  description = "Prefix to use for resource names"
  type        = string
  default     = "ubuntu-docker"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu server"
  type        = string
  default     = null
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the AWS key pair to use for SSH access"
  type        = string
}

variable "private_key_path" {
  description = "Path to the private key file for SSH access"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC to deploy resources"
  type        = string
  default     = null
}

variable "subnet_id" {
  description = "ID of the subnet to deploy the EC2 instance"
  type        = string
  default     = null
}

variable "security_group_name" {
  description = "Name for the security group"
  type        = string
  default     = "ubuntu-docker-sg"
}

variable "ssh_username" {
  description = "Username for SSH access"
  type        = string
  default     = "ubuntu"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "http_cidr_blocks" {
  description = "CIDR blocks for HTTP access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "https_cidr_blocks" {
  description = "CIDR blocks for HTTPS access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "install_docker" {
  description = "Whether to install Docker directly via remote-exec"
  type        = bool
  default     = true
}

variable "use_github_scripts" {
  description = "Whether to use GitHub scripts for setup"
  type        = bool
  default     = false
}

variable "github_repo_url" {
  description = "URL of the GitHub repository containing setup scripts"
  type        = string
  default     = ""
}

variable "github_repo_path" {
  description = "Path where to clone the GitHub repository"
  type        = string
  default     = "/home/ubuntu/setup"
}

variable "github_script_path" {
  description = "Path to the setup script within the GitHub repository"
  type        = string
  default     = "setup-docker.sh"
}
