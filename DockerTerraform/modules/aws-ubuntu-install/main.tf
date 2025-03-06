# AWS Ubuntu Docker Server Module

# Create a security group for the instance
resource "aws_security_group" "ubuntu_sg" {
  name        = var.security_group_name
  description = "Security group for Ubuntu server with Docker"
  vpc_id      = var.vpc_id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
  }

  # HTTP access (for potential web applications)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.http_cidr_blocks
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.https_cidr_blocks
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-sg"
    }
  )
}

# Create an EC2 instance
resource "aws_instance" "ubuntu_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.ubuntu_sg.id]
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
      "bash /tmp/install_script.sh"
    ]
    when        = create
  }
}
