#!/bin/bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to the docker group
# Note: Using ubuntu as the default user for AWS Ubuntu instances
sudo usermod -aG docker ubuntu

# Change ownership of the Docker socket to allow the current user to access it
# This is a temporary solution that will work immediately
sudo chmod 666 /var/run/docker.sock

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Apply the new group membership without requiring logout/login
# This creates a new shell with the updated group membership
newgrp docker << EOF

# Verify installations
docker --version
docker-compose --version

# Test docker access by pulling a small image
docker pull hello-world
docker run hello-world

echo "Docker installation and configuration complete!"
EOF

# Add a note for the user about reconnecting
echo ""
echo "NOTE: For the group changes to take effect in your current session, please disconnect and reconnect to the server."
echo "Until then, you can use 'sudo docker' to run Docker commands."

exit 0
