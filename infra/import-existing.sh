#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

PROJECT_NAME="${TF_VAR_project_name:-personal-website}"
INFRA_REGION="${AWS_REGION:-${TF_VAR_aws_region:-us-east-1}}"
STATE_REGION="${STATE_REGION:-$INFRA_REGION}"
export AWS_REGION="$INFRA_REGION"
export AWS_DEFAULT_REGION="$INFRA_REGION"

if [ -z "${TF_VAR_domain_name:-}" ] || [ -z "${TF_VAR_amplify_repo_url:-}" ]; then
  echo "Missing required TF_VAR values. Ensure TF_VAR_domain_name and TF_VAR_amplify_repo_url are set."
  exit 1
fi

AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
STATE_BUCKET="${PROJECT_NAME}-tf-state-${AWS_ACCOUNT_ID}"
STATE_BUCKET="$(echo "$STATE_BUCKET" | tr '[:upper:]' '[:lower:]')"
STATE_TABLE="${PROJECT_NAME}-tf-locks"

if ! aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  if [ "$STATE_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$STATE_BUCKET" --region "$STATE_REGION"
  else
    aws s3api create-bucket --bucket "$STATE_BUCKET" \
      --region "$STATE_REGION" \
      --create-bucket-configuration "LocationConstraint=$STATE_REGION"
  fi
fi
aws s3api put-bucket-versioning --region "$STATE_REGION" \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --region "$STATE_REGION" \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

if ! aws dynamodb describe-table --region "$STATE_REGION" --table-name "$STATE_TABLE" >/dev/null 2>&1; then
  aws dynamodb create-table --region "$STATE_REGION" \
    --table-name "$STATE_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
fi
aws dynamodb wait --region "$STATE_REGION" table-exists --table-name "$STATE_TABLE"

cd "$INFRA_DIR"
terraform init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="key=${PROJECT_NAME}/terraform.tfstate" \
  -backend-config="region=${STATE_REGION}" \
  -backend-config="dynamodb_table=${STATE_TABLE}" \
  -backend-config="encrypt=true" \
  -reconfigure

import_if_id() {
  local address="$1"
  local id="$2"
  if [ -z "$id" ] || [ "$id" = "None" ]; then
    echo "Skip $address (id not found)"
    return 0
  fi
  if terraform state list -no-color | grep -Fxq "$address"; then
    echo "Skip $address (already in state)"
    return 0
  fi
  local output
  if output=$(terraform import "$address" "$id" 2>&1); then
    echo "$output"
    return 0
  fi
  if echo "$output" | grep -q "Resource already managed by Terraform"; then
    echo "Skip $address (already in state)"
    return 0
  fi
  echo "$output"
  return 1
}

DDB_TABLE_NAME="${PROJECT_NAME}-blog-posts"
import_if_id "aws_dynamodb_table.blog_posts" "$DDB_TABLE_NAME"

AMPLIFY_APP_NAME="${PROJECT_NAME}-web"
AMPLIFY_APP_ID="$(aws amplify list-apps --query "apps[?name=='${AMPLIFY_APP_NAME}'].appId | [0]" --output text)"
import_if_id "aws_amplify_app.web" "$AMPLIFY_APP_ID"

AMPLIFY_ROLE_NAME="${PROJECT_NAME}-amplify"
import_if_id "aws_iam_role.amplify" "$AMPLIFY_ROLE_NAME"
import_if_id "aws_iam_role_policy.amplify_access" "${AMPLIFY_ROLE_NAME}:${PROJECT_NAME}-amplify-access"

if [ -n "$AMPLIFY_APP_ID" ] && [ "$AMPLIFY_APP_ID" != "None" ]; then
  BRANCH_NAME="${TF_VAR_amplify_branch:-main}"
  import_if_id "aws_amplify_branch.main" "${AMPLIFY_APP_ID}/${BRANCH_NAME}"
  import_if_id "aws_amplify_domain_association.web" "${AMPLIFY_APP_ID}/${TF_VAR_domain_name}"
fi

echo "Import complete. Next: terraform plan/apply."
