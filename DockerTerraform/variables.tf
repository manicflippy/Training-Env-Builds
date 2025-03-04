variable "environment" {
    description = "Name of the enfviroment, e.g. dev, staging, prod"
    type = string
    default = "dev"
}

variable "region" {
    description = "AWS region to deploy resources"
    type = string
    default = "us-west-2"
    }