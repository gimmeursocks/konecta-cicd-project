output "ecr_repository_url" {
  value = module.ecr_repo.repository_url
}

output "api_endpoint" {
  value = module.api_gw.api_endpoint
}