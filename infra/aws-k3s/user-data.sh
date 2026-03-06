#!/bin/bash
set -e

apt-get update -y
apt-get install -y curl

# Install K3s
curl -sfL https://get.k3s.io | sh -

# Wait for K3s API to become ready
echo "Waiting for K3s API server..."
until /usr/local/bin/kubectl get nodes >/dev/null 2>&1; do
  sleep 5
done

# Create namespace
cat <<EOF | /usr/local/bin/kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: geth
EOF

# Deploy Geth
cat <<EOF | /usr/local/bin/kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: geth-node
  namespace: geth
spec:
  replicas: 1
  selector:
    matchLabels:
      app: geth-node
  template:
    metadata:
      labels:
        app: geth-node
    spec:
      containers:
      - name: geth
        image: ${geth_image}
        ports:
        - containerPort: 8545
EOF

# Expose service
cat <<EOF | /usr/local/bin/kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: geth-node
  namespace: geth
spec:
  type: LoadBalancer
  ports:
  - port: 8545
    targetPort: 8545
  selector:
    app: geth-node
EOF
