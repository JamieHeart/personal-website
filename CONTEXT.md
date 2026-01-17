# Project Context

## Purpose

Control plane for personal website with resume, blog, and infrastructure as code.

## Instructions (active)

- Use Terraform for infrastructure.
- Include a blog backend with CRUD.
- Provide a documented local Make-based workflow.
- Keep a context log in this file.
- Always update this file when instructions change or new workflows are added.

## Decisions

- Web stack: Next.js + React + TypeScript.
- Blog data: DynamoDB with API routes.
- Deploy target: ECS/Fargate behind ALB with Route53/ACM.
- Personalization: `config/profile.json` as source of truth, env overrides allowed.
- Resume content: fetched from private GitHub repo during CI via `scripts/fetch-resume.mjs`.

## Open Questions

- Confirm production domain name and hosted zone.
- Decide whether to use RDS/Postgres instead of DynamoDB.
- Confirm preferred CI/CD environment variables and secrets.

## Change Log

- 2026-01-17: Initialized repo structure and baseline docs.
- 2026-01-17: Added personalization config and resume fetch workflow.
- 2026-01-17: Added root .env example for resume repo secrets.
- 2026-01-17: Removed resume repo fields from config; use root .env only.