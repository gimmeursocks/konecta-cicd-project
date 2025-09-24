terraform {
  backend "s3" {
    bucket       = "konecta-cicd-project-terraform-state-bucket"
    key          = "terraform/prod/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}
