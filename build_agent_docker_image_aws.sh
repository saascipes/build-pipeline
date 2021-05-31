#!/usr/bin/env sh
docker build -f deploy/docker/sg-agent/Dockerfile -t spa_build_pipeline_agent_1 .
docker tag spa_build_pipeline_agent_1 $2/spa_build_pipeline_agent_1:$1
docker push $2/spa_build_pipeline_agent_1:$1
docker tag spa_build_pipeline_agent_1 $2/spa_build_pipeline_agent_1:latest
docker push $2/spa_build_pipeline_agent_1:latest
