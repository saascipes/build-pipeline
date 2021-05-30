#!/usr/bin/env sh
docker build --target client -f deploy/docker/api/Dockerfile -t sg_demo_buildpipeline_client .
docker tag sg_demo_buildpipeline_client $2/sg_demo_buildpipeline_client:$1
docker push $2/sg_demo_buildpipeline_client:$1
docker tag sg_demo_buildpipeline_client $2/sg_demo_buildpipeline_client:latest
docker push $2/sg_demo_buildpipeline_client:latest

docker build --target api -f deploy/docker/api/Dockerfile -t sg_demo_buildpipeline_api .
docker tag sg_demo_buildpipeline_api $2/sg_demo_buildpipeline_api:$1
docker push $2/sg_demo_buildpipeline_api:$1
docker tag sg_demo_buildpipeline_api $2/sg_demo_buildpipeline_api:latest
docker push $2/sg_demo_buildpipeline_api:latest
