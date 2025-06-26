variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "devops-dojo"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "training"
}

variable "allowed_ssh_ips" {
  description = "List of IP addresses allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # This should be restricted
}