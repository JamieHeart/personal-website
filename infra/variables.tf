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
  default     = "Jamie Hartman"
}

variable "cost_center" {
  description = "Cost center tag for reporting"
  type        = string
  default     = "personal"
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

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "container_port" {
  description = "Container port for the web app"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Number of ECS tasks"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory (MiB)"
  type        = number
  default     = 512
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "admin_token" {
  description = "Admin token for blog write access"
  type        = string
  sensitive   = true
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

variable "skip_cert_validation_records" {
  description = "Skip ACM validation Route53 records (useful for importing state)"
  type        = bool
  default     = false
}
