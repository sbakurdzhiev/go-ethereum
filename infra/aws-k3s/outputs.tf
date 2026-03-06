output "public_ip" {
  value = aws_instance.k3s.public_ip
}

output "rpc_endpoint" {
  value = "http://${aws_instance.k3s.public_ip}:8545"
}
