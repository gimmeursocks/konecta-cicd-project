variable "aws_account_id" {
  description = "The AWS account ID where resources will be created."
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "The name of the project, used for naming resources."
  type        = string
  default     = "konecta-cicd-project"
}

variable "image_tag" {
  description = "The tag to use for the Docker image."
  type        = string
  default     = "latest"
}