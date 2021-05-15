#!/usr/bin/env sh
docker build -f deploy/docker/stock_quote_publisher/Dockerfile -t saasglue/stock_quote_publisher:$1 .
docker tag saasglue/stock_quote_publisher:$1 saasglue/stock_quote_publisher:latest