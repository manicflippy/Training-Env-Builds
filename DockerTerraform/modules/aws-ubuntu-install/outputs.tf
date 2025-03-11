output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.ubuntu_server.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.ubuntu_server.public_ip
}

output "private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.ubuntu_server.private_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.private_key_path} ${var.ssh_username}@${aws_instance.ubuntu_server.public_ip}"
}
