#!/usr/bin/env sh
docker build -f deploy/docker/sg-agent/Dockerfile -t sg_demo_buildpipeline_agent_1 .
docker tag sg_demo_buildpipeline_agent_1 [aws ecr repo url]/sg_demo_buildpipeline_agent_1:$1
docker push [aws ecr repo url]/sg_demo_buildpipeline_agent_1:$1
docker tag sg_demo_buildpipeline_agent_1 [aws ecr repo url]/sg_demo_buildpipeline_agent_1:latest
docker push [aws ecr repo url]/sg_demo_buildpipeline_agent_1:latest
