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
CONTAINER_NAME="spot-movie-backend"

# # Check for arguments
# if [[ $# -lt 1 ]] ; then
#     echo '[ERROR] You must supply a Docker Image to pull'
#     exit 1
# fi

# echo "Deploying SpotMovie Backend to Docker Container"

# #Check for running container & stop it before starting a new one
# if [ $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) = "true" ]; then
#     docker stop spot-movie-backend
# fi

# echo "Starting SpotMovie Backend using Docker Image name: $DOCKER_IMAGE"

# docker run -d --rm=true -p 3030:3030  --name spot-movie-backend $DOCKER_IMAGE

# docker ps -a

# docker pull donami/spot-movie-backend:latest  
# docker stop spot-movie-backend
# docker rm spot-movie-backend
# docker rmi donami/spot-movie-backend:current  
# docker tag donami/spot-movie-backend:latest donami/spot-movie-backend:current  
# docker run -d --name spot-movie-backend donami/spot-movie-backend:latest  