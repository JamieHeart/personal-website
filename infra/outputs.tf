output "site_url" {
  value = "https://${var.domain_name}"
}

output "amplify_app_id" {
  value = aws_amplify_app.web.id
}

output "amplify_default_domain" {
  value = aws_amplify_app.web.default_domain
}
