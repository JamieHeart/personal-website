# Personal Website Control Plane

This repo is the control plane for a personal website with a blog backend, infra as code, and CI/CD.

## Stack

- Web: Next.js + React + TypeScript
- Blog API: Next.js API routes (CRUD)
- Data: DynamoDB
- Infra: Terraform
- Deploy: ECS/Fargate + ALB + ACM + Route53 + ECR

## Repo Layout

- `web/`: Next.js app and API
- `infra/`: Terraform for AWS infrastructure
- `scripts/`: setup helpers
- `CONTEXT.md`: running decisions and instructions

## Local Setup

1. Install dependencies

```
make setup
```

2. Start DynamoDB local

```
make db-local
```

3. Create the local table

```
AWS_REGION=us-east-1 DYNAMODB_ENDPOINT=http://localhost:8000 \
  BLOG_TABLE_NAME=personal-website-blog-posts \
  scripts/create-local-table.sh
```

If the script is not executable, run `chmod +x scripts/create-local-table.sh`.
Requires the AWS CLI to be installed locally.

4. Copy env example

```
cp web/.env.example web/.env.local
```

5. Run the dev server

```
make dev
```

## Local Debugging

- App logs: terminal running `make dev`
- API health: `curl http://localhost:3000/api/health`
- Blog API list: `curl http://localhost:3000/api/posts`

## Blog CRUD API

- `GET /api/posts`: list posts
- `POST /api/posts`: create post (admin token required)
- `GET /api/posts/:slug`: fetch one
- `PUT /api/posts/:slug`: update (admin token required)
- `DELETE /api/posts/:slug`: delete (admin token required)

Admin requests require header `x-admin-token` matching `ADMIN_TOKEN`.

Example create post:

```
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-admin-token: change-me" \
  -d '{"slug":"hello","title":"Hello","excerpt":"Intro","content":"Full post","tags":["leadership"]}'
```

## Docker

```
make docker-build
make docker-run
```

`make docker-run` uses `host.docker.internal` for DynamoDB. Update the env if your Docker host differs.

## Terraform

Initialize and plan:

```
make tf-init
make tf-plan
```

Apply (deploy):

```
make tf-apply
```

## CI/CD

GitHub Actions will:

1. Build and test the web app
2. Build and push the Docker image to ECR
3. Apply Terraform for deployment

Required GitHub Secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `TF_VAR_domain_name`
- `TF_VAR_hosted_zone_id`
- `TF_VAR_admin_token`
- `TF_VAR_project_name` (optional)

## Customization

- Update `web/src/app/page.tsx` for homepage messaging
- Update `web/src/app/resume/page.tsx` and replace `web/public/resume.pdf`
- Update `web/src/app/blog/*` for blog UI

## Domain & HTTPS

Terraform provisions ACM certs and Route53 records. Supply your hosted zone and domain vars in `infra/`.
