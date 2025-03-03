



output "vpc_information" {
  description = "VPC Information about Environment"
  value       = "Your ${aws_vpc.vpc.tags.Environment} VPC has an ID of ${aws_vpc.vpc.id}"
}

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