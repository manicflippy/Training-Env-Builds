variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "server_count" {
  description = "Number of Docker servers to create"
  type        = number
  default     = 3
}