module "ecr_repo" {
  source = "./modules/ecr"

  name                 = "${var.project_name}-app"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  scan_on_push         = true
}

module "s3_bucket" {
  source      = "./modules/s3"
  bucket_name = "${var.project_name}-json-bucket"
}

module "lambda_function" {
  source = "./modules/lambda"

  function_name = "${var.project_name}-container-lambda"
  image_uri     = "${module.ecr_repo.repository_url}:${var.image_tag}"
  s3_bucket_arn = module.s3_bucket.bucket_arn
}

module "api_gw" {
  source = "./modules/api_gw"

  api_name          = "${var.project_name}-api"
  lambda_arn        = module.lambda_function.lambda_arn
  lambda_invoke_arn = module.lambda_function.lambda_invoke_arn
}