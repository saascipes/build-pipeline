#!/usr/bin/env sh
docker build --target client -f deploy/docker/api/Dockerfile -t spa_build_pipeline_client .
docker tag spa_build_pipeline_client $2/spa_build_pipeline_client:$1
docker push $2/spa_build_pipeline_client:$1
docker tag spa_build_pipeline_client $2/spa_build_pipeline_client:latest
docker push $2/spa_build_pipeline_client:latest

docker build --target api -f deploy/docker/api/Dockerfile -t spa_build_pipeline_api .
docker tag spa_build_pipeline_api $2/spa_build_pipeline_api:$1
docker push $2/spa_build_pipeline_api:$1
docker tag spa_build_pipeline_api $2/spa_build_pipeline_api:latest
docker push $2/spa_build_pipeline_api:latest
