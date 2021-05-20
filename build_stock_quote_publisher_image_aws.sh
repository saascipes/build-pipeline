#!/usr/bin/env sh
docker build -f deploy/docker/stock_quote_publisher/Dockerfile -t stock_quote_publisher .
docker tag stock_quote_publisher [aws ecr repo url]/sg_demo_stock_quote_publisher:$1
docker push [aws ecr repo url]/sg_demo_stock_quote_publisher:$1
