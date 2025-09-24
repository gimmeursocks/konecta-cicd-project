variable "name" {
  type        = string
  description = "Base name used for resource naming (e.g., cluster name or prefix)."
}

variable "image_tag_mutability" {
  type        = string
  default     = "MUTABLE"
  description = "ECR repository image tag mutability setting. Allowed values: 'MUTABLE' or 'IMMUTABLE'."
}

variable "scan_on_push" {
  type        = bool
  default     = true
  description = "Enable or disable ECR image scanning on push."
}
