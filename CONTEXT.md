# Project Context

## Purpose

Control plane for personal website with resume, blog, and infrastructure as code.

## Instructions (active)

- Use Terraform for infrastructure.
- Include a blog backend with CRUD.
- Provide a documented local Make-based workflow.
- Keep a context log in this file.

## Decisions

- Web stack: Next.js + React + TypeScript.
- Blog data: DynamoDB with API routes.
- Deploy target: ECS/Fargate behind ALB with Route53/ACM.

## Open Questions

- Confirm production domain name and hosted zone.
- Decide whether to use RDS/Postgres instead of DynamoDB.
- Confirm preferred CI/CD environment variables and secrets.

## Change Log

- 2026-01-17: Initialized repo structure and baseline docs.
