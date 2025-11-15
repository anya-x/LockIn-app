# Storage Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# Versioning
variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = false
}

# Lifecycle Rules
variable "lifecycle_rules" {
  description = "List of lifecycle rules"
  type = list(object({
    id                                  = string
    enabled                             = bool
    prefix                              = optional(string)
    transition_ia_days                  = optional(number)
    transition_glacier_days             = optional(number)
    expiration_days                     = optional(number)
    noncurrent_version_expiration_days  = optional(number)
  }))
  default = []
}

# CORS
variable "enable_cors" {
  description = "Enable CORS configuration"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

# Access Logging
variable "enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
