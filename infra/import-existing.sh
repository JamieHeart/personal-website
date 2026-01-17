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

if [ -z "${TF_VAR_domain_name:-}" ] || [ -z "${TF_VAR_hosted_zone_id:-}" ] || [ -z "${TF_VAR_admin_token:-}" ]; then
  echo "Missing required TF_VAR values. Ensure TF_VAR_domain_name, TF_VAR_hosted_zone_id, and TF_VAR_admin_token are set."
  exit 1
fi

# Disable cert validation records during the first import pass to avoid unknown for_each keys.
export TF_VAR_skip_cert_validation_records=true

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

VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"

ECR_REPO_NAME="${PROJECT_NAME}-web"
import_if_id "aws_ecr_repository.web" "$ECR_REPO_NAME"

DDB_TABLE_NAME="${PROJECT_NAME}-blog-posts"
import_if_id "aws_dynamodb_table.blog_posts" "$DDB_TABLE_NAME"

LOG_GROUP_NAME="/ecs/${PROJECT_NAME}"
import_if_id "aws_cloudwatch_log_group.web" "$LOG_GROUP_NAME"

import_if_id "aws_ecs_cluster.this" "${PROJECT_NAME}-cluster"

TASK_EXEC_ROLE="${PROJECT_NAME}-task-execution"
TASK_ROLE="${PROJECT_NAME}-task"
import_if_id "aws_iam_role.task_execution" "$TASK_EXEC_ROLE"
import_if_id "aws_iam_role.task" "$TASK_ROLE"
import_if_id "aws_iam_role_policy_attachment.task_execution_policy" \
  "${TASK_EXEC_ROLE}/arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
import_if_id "aws_iam_role_policy.dynamodb_access" "${TASK_ROLE}:${PROJECT_NAME}-dynamodb"

SG_ALB_ID="$(aws ec2 describe-security-groups \
  --filters Name=group-name,Values="${PROJECT_NAME}-alb" Name=vpc-id,Values="$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)"
SG_ECS_ID="$(aws ec2 describe-security-groups \
  --filters Name=group-name,Values="${PROJECT_NAME}-ecs" Name=vpc-id,Values="$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)"
import_if_id "aws_security_group.alb" "$SG_ALB_ID"
import_if_id "aws_security_group.ecs" "$SG_ECS_ID"

LB_ARN="$(aws elbv2 describe-load-balancers --names "${PROJECT_NAME}-alb" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)"
import_if_id "aws_lb.web" "$LB_ARN"

TG_ARN="$(aws elbv2 describe-target-groups --names "${PROJECT_NAME}-tg" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)"
import_if_id "aws_lb_target_group.web" "$TG_ARN"

LISTENER_HTTP_ARN="$(aws elbv2 describe-listeners --load-balancer-arn "$LB_ARN" \
  --query 'Listeners[?Port==`80`].ListenerArn | [0]' --output text)"
LISTENER_HTTPS_ARN="$(aws elbv2 describe-listeners --load-balancer-arn "$LB_ARN" \
  --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text)"
import_if_id "aws_lb_listener.http" "$LISTENER_HTTP_ARN"
import_if_id "aws_lb_listener.https" "$LISTENER_HTTPS_ARN"

CERT_ARN="$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='${TF_VAR_domain_name}'].CertificateArn | [0]" --output text)"
import_if_id "aws_acm_certificate.web" "$CERT_ARN"

import_if_id "aws_route53_record.web" "${TF_VAR_hosted_zone_id}_${TF_VAR_domain_name}_A"

TASK_DEF_ARN="$(aws ecs list-task-definitions \
  --family-prefix "${PROJECT_NAME}-task" --sort DESC --max-items 1 \
  --query 'taskDefinitionArns[0]' --output text)"
import_if_id "aws_ecs_task_definition.web" "$TASK_DEF_ARN"

SERVICE_ID="${PROJECT_NAME}-cluster/${PROJECT_NAME}-service"
import_if_id "aws_ecs_service.web" "$SERVICE_ID"

unset TF_VAR_skip_cert_validation_records

if [ -n "$CERT_ARN" ] && [ "$CERT_ARN" != "None" ]; then
  aws acm describe-certificate --certificate-arn "$CERT_ARN" \
    --query 'Certificate.DomainValidationOptions[].{domain:DomainName,name:ResourceRecord.Name,type:ResourceRecord.Type}' \
    --output text | while read -r domain_name record_name record_type; do
      if [ -n "$record_name" ] && [ -n "$record_type" ]; then
        import_if_id "aws_route53_record.cert_validation[\"${domain_name}\"]" \
          "${TF_VAR_hosted_zone_id}_${record_name}_${record_type}"
      fi
    done
fi

echo "Import complete. Next: terraform plan/apply."
