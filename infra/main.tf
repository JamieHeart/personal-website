locals {
  name_prefix = var.project_name
  default_tags = merge(
    {
      Project     = var.project_name
      Application = var.project_name
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Service     = var.service_name
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )
}

resource "aws_dynamodb_table" "blog_posts" {
  name         = "${local.name_prefix}-blog-posts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "slug"
  tags         = local.default_tags

  attribute {
    name = "slug"
    type = "S"
  }
}

resource "aws_iam_role" "amplify" {
  name = "${local.name_prefix}-amplify"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "amplify.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_access" {
  name = "${local.name_prefix}-amplify-access"
  role = aws_iam_role.amplify.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ],
        Resource = aws_dynamodb_table.blog_posts.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_amplify_app" "web" {
  name                = "${local.name_prefix}-web"
  repository          = var.amplify_repo_url
  access_token        = var.amplify_access_token
  platform            = "WEB_COMPUTE"
  iam_service_role_arn = aws_iam_role.amplify.arn
  build_spec = <<EOF
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci --prefix web
            - node scripts/fetch-resume.mjs
        build:
          commands:
            - npm run build --prefix web
      artifacts:
        baseDirectory: web/.next
        files:
          - '**/*'
      cache:
        paths:
          - web/node_modules/**/*
          - web/.next/cache/**/*
EOF

  environment_variables = {
    AWS_REGION           = var.aws_region
    BLOG_TABLE_NAME      = aws_dynamodb_table.blog_posts.name
    ADMIN_TOKEN          = var.admin_token
    RESUME_REPO_TOKEN    = var.resume_repo_token
    RESUME_REPO_OWNER    = var.resume_repo_owner
    RESUME_REPO_NAME     = var.resume_repo_name
    RESUME_REPO_README_PATH = var.resume_repo_readme_path
    RESUME_REPO_PDF_PATH = var.resume_repo_pdf_path
    RESUME_REPO_REF      = var.resume_repo_ref
    OPENAI_API_KEY       = var.openai_api_key
    OPENAI_MODEL         = var.openai_model
    NEXT_PUBLIC_SITE_URL = "https://${var.domain_name}"
  }

  tags = local.default_tags
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.web.id
  branch_name       = var.amplify_branch
  enable_auto_build = true
  stage             = "PRODUCTION"
}

resource "aws_amplify_domain_association" "web" {
  app_id                = aws_amplify_app.web.id
  domain_name           = var.domain_name
  wait_for_verification = true

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}
