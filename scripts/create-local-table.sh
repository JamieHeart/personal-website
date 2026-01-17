#!/usr/bin/env bash
set -euo pipefail

TABLE_NAME="${BLOG_TABLE_NAME:-personal-website-blog-posts}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENDPOINT_URL="${DYNAMODB_ENDPOINT:-http://localhost:8000}"

aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions AttributeName=slug,AttributeType=S \
  --key-schema AttributeName=slug,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION" \
  --endpoint-url "$ENDPOINT_URL" || true

echo "Table ensured: $TABLE_NAME at $ENDPOINT_URL"
