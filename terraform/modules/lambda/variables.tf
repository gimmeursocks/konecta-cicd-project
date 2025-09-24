variable "function_name" {
  description = "The name of the Lambda function."
  type        = string
}
variable "image_uri" {
  description = "The URI of the Docker image in ECR."
  type        = string
}
variable "s3_bucket_arn" {
  description = "The ARN of the S3 bucket for Lambda function code storage."
  type        = string
}
