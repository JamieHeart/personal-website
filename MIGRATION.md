# Amplify Migration Checklist

Use this checklist to migrate from ECS/ALB to Amplify Hosting with minimal downtime.

## 1) Prep
- [ ] Confirm the repo is connected to Amplify and `amplify_access_token` has repo read access.
- [ ] Ensure the domain is in the same AWS account's Route53 or be ready to add DNS records manually.
- [ ] Verify required secrets are set in GitHub:
  - [ ] `TF_VAR_amplify_repo_url`
  - [ ] `TF_VAR_amplify_access_token`
  - [ ] `TF_VAR_amplify_branch` (optional, default `main`)
  - [ ] `TF_VAR_domain_name`
  - [ ] `TF_VAR_admin_token`
  - [ ] `RESUME_REPO_TOKEN`, `RESUME_REPO_OWNER`, `RESUME_REPO_NAME`
  - [ ] `RESUME_REPO_README_PATH`, `RESUME_REPO_PDF_PATH`, `RESUME_REPO_REF`
  - [ ] `OPENAI_API_KEY` (and `OPENAI_MODEL` if you override)

## 2) Sync Terraform state
- [ ] Run `terraform init` in `infra/` with the existing backend.
- [ ] If Terraform already manages the ECS/ALB stack, continue to step 3.
- [ ] If Terraform does not manage current ECS/ALB, run `infra/import-existing.sh` first.

## 3) Create Amplify resources
- [ ] Run `terraform plan` and confirm it adds Amplify resources.
- [ ] Run `terraform apply`.
- [ ] Wait for Amplify build to complete and confirm the default Amplify URL works.

## 4) Cut over domain
- [ ] Verify Amplify domain association validation succeeded.
- [ ] Confirm `https://<your-domain>` resolves to Amplify.
- [ ] Smoke test: homepage, resume page, blog list, and blog CRUD admin flow.

## 5) Remove ECS/ALB stack
- [ ] Run `terraform plan` and confirm ECS/ALB resources are set to destroy.
- [ ] Run `terraform apply` to remove ECS/ALB resources.
- [ ] Confirm DynamoDB remains (blog content).

## 6) Post-migration checks
- [ ] Verify CloudWatch logs from Amplify show successful requests.
- [ ] Confirm resume fetch and personalization run during Amplify build.
- [ ] Remove any unused secrets (ECR, ECS, ALB) from GitHub when safe.
