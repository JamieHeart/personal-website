variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "personal-website"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment tag for cost reporting"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for cost reporting"
  type        = string
  default     = "owner-name"
}

variable "cost_center" {
  description = "Cost center tag for reporting"
  type        = string
  default     = "cost-center"
}

variable "service_name" {
  description = "Service tag for reporting"
  type        = string
  default     = "web"
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "Full domain name for the site (e.g., example.com)"
  type        = string
}

variable "amplify_repo_url" {
  description = "Git repository URL for Amplify (e.g., https://github.com/org/repo)"
  type        = string
}

variable "amplify_access_token" {
  description = "Git provider access token for Amplify"
  type        = string
  sensitive   = true
}

variable "amplify_branch" {
  description = "Git branch to deploy in Amplify"
  type        = string
  default     = "main"
}

variable "admin_token" {
  description = "Admin token for blog write access"
  type        = string
  sensitive   = true
}

variable "resume_repo_token" {
  description = "GitHub token for fetching resume content"
  type        = string
  sensitive   = true
}

variable "resume_repo_owner" {
  description = "Resume repo owner"
  type        = string
}

variable "resume_repo_name" {
  description = "Resume repo name"
  type        = string
}

variable "resume_repo_readme_path" {
  description = "Path to README in resume repo"
  type        = string
}

variable "resume_repo_pdf_path" {
  description = "Path to PDF in resume repo"
  type        = string
}

variable "resume_repo_ref" {
  description = "Git ref for resume repo (branch or tag)"
  type        = string
  default     = "main"
}

variable "openai_api_key" {
  description = "OpenAI API key for blog field generation"
  type        = string
  sensitive   = true
}

variable "openai_model" {
  description = "OpenAI model for blog field generation"
  type        = string
  default     = ""
}
