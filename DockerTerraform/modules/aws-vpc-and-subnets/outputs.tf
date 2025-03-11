output "vpc_id" {
  description = "Output the ID for the primary VPC"
  value       = aws_vpc.vpc.id
}

output "public_subnet_ids" {
  description = "Output the IDs for the public subnets"
  value = values(aws_subnet.public_subnets)[*].id
}

output "private_subnet_ids" {
  description = "Output the IDs for the private subnets"
  value = values(aws_subnet.private_subnets)[*].id
}