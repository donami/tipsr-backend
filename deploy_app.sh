#!/bin/bash
########################################
# Put this on a Server
# run chmod +x deploy_app.sh to make the script executable
# 
# Execute this script:  ./deploy_app.sh ariv3ra/python-circleci-docker:$TAG
# Replace the $TAG with the actual Build Tag you want to deploy
#
########################################

set -e

DOCKER_IMAGE=$1
CONAINER_NAME="spot-movie-backend"

# Check for arguments
if [[ $# -lt 1 ]] ; then
    echo '[ERROR] You must supply a Docker Image to pull'
    exit 1
fi

echo "Deploying SpotMovie Backend to Docker Container"

#Check for running container & stop it before starting a new one
if [ $(docker inspect -f '{{.State.Running}}' $CONAINER_NAME) = "true" ]; then
    docker stop spot-movie-backend
fi

echo "Starting SpotMovie Backend using Docker Image name: $DOCKER_IMAGE"

docker run -d --rm=true -p 3030:3030  --name spot-movie-backend $DOCKER_IMAGE

docker ps -a