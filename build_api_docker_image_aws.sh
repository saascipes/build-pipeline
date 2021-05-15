#!/usr/bin/env sh
docker build --target client -f deploy/docker/api/Dockerfile -t sg_demo_buildpipeline_client .
docker tag sg_demo_buildpipeline_client 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_client:$1
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_client:$1
docker tag sg_demo_buildpipeline_client 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_client:latest
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_client:latest

docker build --target api -f deploy/docker/api/Dockerfile -t sg_demo_buildpipeline_api .
docker tag sg_demo_buildpipeline_api 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_api:$1
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_api:$1
docker tag sg_demo_buildpipeline_api 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_api:latest
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_api:latest
