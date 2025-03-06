https://docs.docker.com/reference/cli/docker/

### Docker Version

```sh
docker version
```

### Downgrade to a Previous Version

```sh
sudo systemctl stop docker
sudo apt-get remove -y docker-ce docker-ce-cli
sudo apt-get update
sudo apt-get install -y docker-ce=5:18.09.4~3-0~ubuntu-bionic docker-ce-cli=5:18.09.4~3-0~ubuntu-bionic
docker version
```

## Upgrade to a New Version

```sh
sudo apt-get install -y docker-ce=5:18.09.5~3-0~ubuntu-bionic docker-ce-cli=5:18.09.5~3-0~ubuntu-bionic
docker version
```

## Verify Version

```sh
sudo docker version
```

# Backing Up and Restoring Docker Swarm

## On the Manager

### Backup

```sh
sudo systemctl stop docker
sudo tar -zvcf backup.tar.gz -C /var/lib/docker/swarm .
sudo systemctl start docker
```

### Restore from Backup

```sh
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/swarm/*
sudo tar -zxvf backup.tar.gz -C /var/lib/docker/swarm/
sudo systemctl start docker
docker node ls
```

# Docker Images

## Download from a Remote Registry

```
docker image pull IMAGE:TAG
```

## List Images

```sh
docker image ls
docker images
```

List images with intermediate images.

```sh
docker image ls -a
```

## Get Detailed Information About an Image

```sh
docker image inspect IMAGE
```

Use the `--format` flag to get only a subset of information (uses Go templates).

```sh
docker image inspect IMAGE --format TEMPLATE
```

## Delete an Image Without Tags

Note: Tags must be removed first.

```sh
docker rm IMAGE
docker rmi IMAGE
```

## Delete an Image and Automatically Remove All Tags

```sh
docker image rm -f IMAGE_ID
docker rmi -f IMAGE_ID
```

## Delete Unused Images from the System

```sh
docker image prune
```

## Build an Image from a Dockerfile

```sh
docker image build -t <image name>
```

Build an image from a Dockerfile without cache.

```sh
docker image build -t <image name> . --no-cache
```

## See Details About Image Layers

```sh
docker image history IMAGE
```

## Search Docker Hub for Images

```sh
docker search <string>
```


Let me know if there's anything else you need help with!

# Image Clean Up

## Get Information About Disk Usage on the System

```sh
docker system df
```

Get even more detailed disk usage information.

```sh
docker system df -v
```

Remove dangling images (images not referenced by any tag or container).

```sh
docker image prune
```

Remove all unused images (not used by a container).

```sh
docker image prune -a
```

## Docker Services

Create a service.

```sh
docker service create [OPTIONS] IMAGE [COMMAND] [ARG...]
docker service create [--name <serviceName> --replicas <#of tasks> -d -p <port>:<port>] <IMAGE> [COMMAND] [ARG...]
```

List current services.

```sh
docker service ls
```

List a service's tasks.

```sh
docker service ps <service>
```

Get more information about a service.

```sh
docker service inspect <service>
docker service inspect --pretty <service>
```

View Docker logs for a running service.

```sh
docker service logs <service name>
```

Make changes to a service.

```sh
docker service update [OPTIONS] <Service>
```

Delete an existing service.

```sh
docker service rm <Service>
```

Change the desired state of the service running in the swarm.

```sh
docker service scale <SERVICE-ID>=<NUMBER-OF-TASKS>
```

## Service Templates

Templates can be used to give somewhat dynamic values to some flags with `docker service create`. The following flags accept templates:

- `--hostname`
- `--mount`
- `--env`

This command sets an environment variable for each container that contains the hostname of the node that the container is running on.

```sh
docker service create --env NODE_HOSTNAME="{{.Node.Hostname}}" nginx
```

## Node Labels

You can add pieces of metadata to your swarm nodes using node labels. You can then use these labels to determine which nodes tasks will run on. For example, with nodes in multiple datacentres or availability zones, you can use labels to specify which zone each node is in. Then, execute tasks in specific zones or distribute them evenly across zones.

Add a label to a node.

```sh
docker node update --label-add <label>=<value> <node>
```

View existing node labels.

```sh
docker node inspect --pretty <node>
```

To run a service's tasks only on nodes with a specific label value, use the `--constraint` flag with `docker service create`.

```sh
docker service create --constraint node.labels.<LABEL>==<Value> <image>
```

To run a service's tasks only on nodes that do not have a specific label value.

```sh
docker service create --constraint node.labels.<LABEL>!=<Value> <image>
```

Use `--placement-pref` with the spread strategy to spread tasks evenly across all values of a particular label (note NULL counts as a value).

```sh
docker service create --placement-pref spread=node.labels.<label> <image>
```

For example, if you have a label called `availability_zone` with 3 values (east, west, south), the tasks will be divided evenly among the node groups with each of those values, no matter how many nodes there are in the group.

## Docker Inspect

Get information about Docker objects such as containers, images, services, etc.

```sh
docker inspect <object_id>
```

If you know what kind of object you are inspecting, you can use an alternative form which allows you to specify the object by name rather than ID.

```sh
docker container inspect <container>
docker service inspect <service>
```

For some objects, you can also use the `--pretty` flag to get a more readable output.

## Docker Compose (Same Host)

Create and run the resources defined in `docker-compose.yml`. The `-d` works the same way it does in `docker run`, running the application in detached mode.

```sh
docker-compose up -d
```

Stop and remove all resources that were created using `docker-compose up`. This relies on being in the project directory to reference `docker-compose.yml`.

```sh
docker-compose down
```

List containers/services that are running under Docker Compose.

```sh
docker-compose ps
```

## Docker Stacks

Deploy a new stack to the cluster using a compose file.

```sh
docker stack deploy -c <compose file stack>
docker stack deploy --compose-file <compose file stack>
```

List current stacks.

```sh
docker stack ls
```

List the tasks associated with a stack.

```sh
docker stack ps <stack>
```

Delete a stack.

```sh
docker stack rm <stack>
```

Show logs for a service within a stack.

```sh
docker service logs <stack>_<service name>
```

## Working with Volumes

### `--mount` Syntax

```sh
docker run --mount [key=value][,key=value...]
```

- `type`: bind (bind mount), volume, or tmpfs (temporary in-memory storage)
- `source`, `src`: Volume name or bind mount path
- `destination`, `dst`, `target`: Path to mount inside the container
- `readonly`: Make the volume or bind mount read-only

### `-v` Syntax

```sh
docker run -v <source>:<destination>[:OPTIONS]
```

- `source`: If this is a volume name, it will create a volume. If this is a path, it will create a bind mount.
- `destination`: Location to mount the data inside the container.
- `options`: Comma-separated list of options. For example, `ro` for read-only.

To mount the same volume to multiple containers allowing them to interact with one another by sharing data, just mount the volume to both using the same volume name.

```sh
docker run --name container1 --mount source=shared-vol .....
docker run --name container2 --mount source=shared-vol .....
```

## Managing Volumes

Create a volume.

```sh
docker volume create <volume_name>
```

List current volumes.

```sh
docker volume ls
```

Get detailed information about a volume.

```sh
docker volume inspect <volume_name>
```

Delete a volume.

```sh
docker volume rm <volume_name>
```

## Networking

Create a network.

```sh
docker network create -d <driver> <networkName> [OPTIONS]
```

Run a new container, connecting it to the specified network.

```sh
docker run --network <network>
```

Run a service attached to an existing network.

```sh
docker service create --network <network>
```

Connect a running container to an existing network.

```sh
docker network connect <network> <container>
```

Network connect general usage.

```sh
docker network connect [OPTIONS] <network> <container>
```

List networks.

```sh
docker network ls
```

Inspect a network.

```sh
docker network inspect <network>
```

Disconnect a running container from an existing network.

```sh
docker network disconnect <network> <container>
```

Delete a network.

```sh
docker network rm <network>
```

## Aliases

Provide a network alias to a container.

```sh
docker run [run parameters] --network-alias <alias>
```

OR

```sh
docker network connect --alias <alias>
```

## Ports

Publish a port on the host, mapping it to a port on the container.

```sh
docker run -p <host port>:<container port>
```

Publish a port on all swarm hosts, mapping it to a port on the service's containers.

```sh
docker service create -p <host port>:<container port>
```

List port mappings for a container.

```sh
docker port <container>
```

Also displays port info.

```sh
docker ps
```

Publish a service port using host mode.

```sh
docker service create --publish mode=host,target=<container port>,published=<host port>
docker service create -p mode=host,target=<container port>,published=<host port>
```

# Network Troubleshooting

## Get Container Logs

```sh
docker logs <container>
```

## Get Collated Logs from Tasks of a Service

```sh
docker service logs <service>
```

## Get Docker Daemon Logs

```sh
journalctl -u docker
```

## Create a Custom Network with a Container

Create a custom network and attach a netshoot container to the network for troubleshooting.

```sh
docker network create custom-net
docker run -d --name custom-net-nginx --network custom-net nginx
```

## Inject a Netshoot Container into Another Container's Network Sandbox

```sh
docker run --rm --network custom-net nicolaka/netshoot curl custom-net-nginx:80
docker run --rm --network container:custom-net-nginx nicolaka/netshoot curl localhost:80
```

## Inject a Netshoot Container into the Sandbox of a Container that Uses the None Network

```sh
docker run -d --name none-net-nginx --network none nginx
docker run --rm --network container:none-net-nginx nicolaka/netshoot curl localhost:80
```

## DNS

Change the default for the host with DNS setting in `daemon.json`.

```json
{
  "dns": ["8.8.8.8"]
}
```

## Signing Images

Run a container with a custom and override default external DNS.

```sh
docker run --dns <DNS address>
```

Generate a delegation key pair. This gives users access to sign images for a repository.

```sh
docker trust key generate <signerName>
```

Add a signer (user) to a repo.

```sh
docker trust signer add --key <keyfile> <signer name> <repo>
```

Create a new tag for an image and push to registry.

```sh
docker tag <image>:<tag> <repo>/<image>:<tag>
```

Sign an image and push it to the registry.

```sh
docker trust sign <repo>:<tag>
```

## Secure Docker Daemon HTTP Socket

Configure Docker to listen on an HTTP port, which you can connect to in order to manage the daemon. To do this securely, follow these steps:

1. Create a certificate authority.
2. Create server and client certificates.
3. Configure the daemon on the server to use `tlsverify` mode.
4. Configure the client to connect securely using the client certificate.

For detailed instructions, refer to the Docker documentation.

## Executing Commands on Container

Possible while PID 1 is running.

Run commands while being ON the container.

```sh
docker container exec --it <container ID/container name> <bash/sh>
```

Run commands on the container from the terminal (from outside the container).

```sh
docker container exec --t <container ID/container name> <arbitrary command and parameters>
```

- `-it` = `-i-t`
- `-i` --interactive
- `-t` --tty Allocate a pseudo-TTY



# Enterprise Edition Backup


```markdown
# Enterprise Edition

## Backup the Cluster

### Back up the Docker Swarm
(Note: This is done the same way for UCP swarm as it is for a regular, non-UCP swarm.)

### Back up UCP

### Back up DTR Images

### Back up DTR Metadata

## Back up UCP

1. Log in to the UCP manager server.
2. Back up the UCP data.

```sh
sudo docker container run \
  --rm \
  --log-driver none \
  --name ucp \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume /tmp:/backup \
  mirantis/ucp:3.3.2 backup \
  --file ucp_backup.tar \
  --passphrase "mysecretphrase" \
  --include-logs=false
```

3. List the contents of the backup file to verify it worked. You will need to enter your passphrase.

```sh
gpg --decrypt /tmp/ucp_backup.tar | tar --list
```

## Back up DTR

1. Log in to the DTR server.
2. Get the DTR replica ID.

```sh
REPLICA_ID=$(sudo docker ps --format '{{.Names}}' -f name=dtr-rethink | cut -f 3 -d '-') && echo $REPLICA_ID
```

3. Back up the registry images.

```sh
sudo tar -cvf dtr-backup-images.tar /var/lib/docker/volumes/dtr-registry-$REPLICA_ID
```

4. Verify the image backup file's contents.

```sh
tar -tf dtr-backup-images.tar
```

## Back up DTR Metadata

1. Set the UCP private IP.

```sh
UCP_PRIVATE_IP=<UCPManagerPrivateIP>
```

2. Back up the DTR metadata.

```sh
read -sp 'ucp password: ' UCP_PASSWORD; \
sudo docker run --log-driver none -i --rm \
  --env UCP_PASSWORD=$UCP_PASSWORD \
  mirantis/dtr:2.8.2 backup \
  --ucp-url https://$UCP_PRIVATE_IP \
  --ucp-insecure-tls \
  --ucp-username admin \
  --existing-replica-id $REPLICA_ID > dtr-backup-metadata.tar
```

3. Verify the backup file's contents.

```sh
tar -tf dtr-backup-metadata.tar
```




