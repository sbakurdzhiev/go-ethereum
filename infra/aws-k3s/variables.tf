variable "region" {
  description = "AWS region"
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.micro"
}

variable "geth_image" {
  description = "Container image for Geth"
  type        = string
}
