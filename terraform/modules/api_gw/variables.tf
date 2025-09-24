variable "api_name" {
  description = "value for naming the API Gateway"
  type        = string
}
variable "lambda_arn" {
  description = "The ARN of the Lambda function to be integrated with API Gateway."
  type        = string
}
variable "lambda_invoke_arn" {
  description = "The invoke ARN of the Lambda function."
  type        = string
}
