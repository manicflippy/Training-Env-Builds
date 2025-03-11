# AWS Ubuntu Docker Server Module

# Create an EC2 instance for Ubuntu server
resource "aws_instance" "ubuntu_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [var.security_group_id]
  subnet_id              = var.subnet_id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-server"
    }
  )
}

# Conditionally execute installation script using remote-exec
resource "null_resource" "script_execution" {
  count = var.installation_script != "" ? 1 : 0

  depends_on = [aws_instance.ubuntu_server]

  # Connection details for provisioner
  connection {
    type        = "ssh"
    user        = var.ssh_username
    private_key = file(var.private_key_path)
    host        = aws_instance.ubuntu_server.public_ip
  }

# Copy the installation script
  provisioner "file" {
    source      = "${path.root}/${var.installation_script}"
    destination = "/tmp/install_script.sh"
    when        = create
  }

  # Execute the installation script
  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/install_script.sh",
      "sed -i 's/\\r$//' /tmp/install_script.sh",  # Convert Windows line endings to Unix
      "bash /tmp/install_script.sh"
    ]
    when        = create
  }
}
