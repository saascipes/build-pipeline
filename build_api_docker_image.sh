#!/usr/bin/env sh
docker build --target client -f deploy/docker/api/Dockerfile -t saasglue/sg_demo_buildpipeline_client:$1 .
docker tag saasglue/sg_demo_buildpipeline_client:$1 saasglue/sg_demo_buildpipeline_client:latest

docker build --target api -f deploy/docker/api/Dockerfile -t saasglue/sg_demo_buildpipeline_api:$1 .
docker tag saasglue/sg_demo_buildpipeline_api:$1 saasglue/sg_demo_buildpipeline_api:latest
