#!/usr/bin/env sh
docker build -f deploy/docker/stock_quote_publisher/Dockerfile -t stock_quote_publisher .
docker tag stock_quote_publisher 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_stock_quote_publisher:$1
docker push 948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_stock_quote_publisher:$1
