#!/usr/bin/env sh
docker build -f deploy/docker/sg-agent/Dockerfile -t sg_demo_buildpipeline_agent_1 .
docker tag sg_demo_buildpipeline_agent_1 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_agent_1:$1
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_agent_1:$1
docker tag sg_demo_buildpipeline_agent_1 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_agent_1:latest
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_agent_1:latest
