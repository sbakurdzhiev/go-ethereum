# 📘 DevOps Pipeline for Ethereum Devnet (Fork of go‑ethereum)

## 🧭 Overview

This repository is a fork of **go‑ethereum (Geth)** extended with a complete DevOps automation pipeline.  
It demonstrates how to build, deploy, test, and operate an Ethereum development network using:

- **GitHub Actions** (CI/CD)  
- **Docker & Docker Compose**  
- **Hardhat** (smart contract deployment & testing)  
- **Terraform** (cloud provisioning)  
- **k3s** (lightweight Kubernetes)

Snippets of local tests will be included in the end. 
Also Blockscout bonus task was tested and will be added in end section

---

# 🏗️ Architecture

```
GitHub Actions
 ├── CI:Build → Build & push Geth image
 ├── CI:Deploy → Deploy Hardhat contracts & build predeployed image
 └── Tests → Run Hardhat tests against predeployed image
        │
        ▼
Docker Images (GHCR)
 ├── geth-devnet:<sha>
 └── geth-devnet-predeployed:<sha>
        │
        ▼
Local Devnet (Docker Compose)
 ├── Geth devnet
 ├── Hardhat deployment
        │
        ▼
Terraform → AWS → k3s
 └── Deploy devnet image to Kubernetes
```

---

# 📂 Repository Structure

```
.
├── .github/workflows/
│   ├── ci-build.yml
│   ├── ci-deploy.yml
│   └── tests.yml
│
├── docker/
│   ├── Dockerfile.geth
│   ├── Dockerfile.predeployed
│   └── docker-compose.yml
│
├── hardhat/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── k8s-manifests/
│       ├── deployment.yaml
│       └── service.yaml
│
└── README.md
```

---

# 🚀 CI/CD Workflows

## 1️⃣ CI:Build  
**Trigger:** PR merged with label `CI:Build`

### Workflow actions:
- Build Docker image of forked Geth  
- Tag with commit SHA  
- Push to GitHub Container Registry  
- Output image reference for downstream workflows  

---

## 2️⃣ CI:Deploy  
**Trigger:** PR merged with label `CI:Deploy`

This workflow performs three major tasks:

### **A. Start a local devnet using the newly built Geth image**
- Runs Docker Compose  
- Exposes RPC  

### **B. Deploy Hardhat sample project**
- Executes `npx hardhat run scripts/deploy.js`  
- Saves deployed contract addresses  

### **C. Build a new “predeployed contracts” Docker image**
- Bundles contract artifacts  
- Bundles deployment outputs  
- Pushes image to registry with tag:  
  ```
  geth-devnet-predeployed:<sha>
  ```

---

## 3️⃣ Tests Workflow  
Runs Hardhat tests against the predeployed image.

### Steps:
- Pull predeployed image  
- Start devnet  
- Run Hardhat tests  
- Validate contract behavior  

---

# 🧪 Hardhat Sample Project

Located in:

```
/hardhat
```

Includes:

- Example contract (`Lock.sol`)  
- Deployment script  
- Test suite  
- Hardhat config pointing to local devnet  

### Deploy:
```
npx hardhat run scripts/deploy.js --network local
```

---

# 🏗️ Terraform — Cloud Infrastructure

Located in:

```
infra/
```

### Terraform provisions:
- Cloud VM (AWS)  
- Installs **k3s**  
- Deploys your predeployed Geth image to Kubernetes  

### Usage:
```
terraform init
terraform apply
```

### Outputs:
- Public IP of k3s node  
- RPC endpoint

---

# 🔍 Bonus: Blockscout Explorer

Blockscout is integrated into the Docker Compose environment.

### Features:
- Full blockchain explorer  
- Transaction indexing  
- Contract verification  
- Token metadata  

### Access:
```
http://localhost:3000
```

---

# 🧠 End‑to‑End Flow Summary

1. Developer opens PR  
2. PR merged with label `CI:Build`  
   → Geth image built & pushed  
3. PR merged with label `CI:Deploy`  
   → Devnet started  
   → Hardhat deployed  
   → Predeployed image built & pushed  
4. Tests run against predeployed image  
5. Terraform provisions k3s cluster  
6. Devnet deployed to Kubernetes  

---

# 📚 Technologies Used

| Category | Tools |
|---------|-------|
| Blockchain | Geth |
| Smart Contracts | Hardhat |
| CI/CD | GitHub Actions |
| Containers | Docker, GHCR |
| IaC | Terraform |
| Orchestration | k3s |
| Cloud | AWS |

---

# 🏁 Local Tests
###RPC response from Geth:
<img width="921" height="135" alt="2 container-test" src="https://github.com/user-attachments/assets/c2a65502-5137-4e0d-91c6-e1afea614157" />

###Docker Compose tests:
<img width="1138" height="342" alt="3 docker-compose-test" src="https://github.com/user-attachments/assets/36a9ea36-6b4a-421a-84c2-62f3e8bc3fec" />

###Hardhat tests:
<img width="1281" height="117" alt="5 hardhat-local-tests" src="https://github.com/user-attachments/assets/b26193c5-6b08-4dc3-8336-00b8a9b4554d" />

###Full CI:Deploy run:
https://github.com/sbakurdzhiev/go-ethereum/actions/runs/22742095423

###AWS k3s cluster with geth node deployment:
<img width="1883" height="562" alt="6 terraform-k3s-deploy" src="https://github.com/user-attachments/assets/d49bbad2-6b81-4824-a193-c67041dc77fe" />

---

###Blockscout - testing in progress, still unsuccesful:

Tested with many images, still blockscout container was shutting down during startup with errors for migrations:
docker-compose.yml metadata for blockscout:
```
version: "3.8"

services:
  geth:
    image: ghcr.io/sbakurdzhiev/geth-predeployed:latest
    container_name: geth
    ports:
      - "8545:8545"
    command: >
      --http
      --http.addr 0.0.0.0
      --http.api eth,net,web3
      --http.vhosts="*"
      --http.corsdomain="*"
    networks:
      - blockscout

  postgres:
    image: postgres:15
    container_name: blockscout-postgres
    environment:
      POSTGRES_USER: blockscout
      POSTGRES_PASSWORD: blockscout
      POSTGRES_DB: blockscout
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - blockscout

  indexer:
    image: blockscout/blockscout-indexer:latest
    container_name: blockscout-indexer
    environment:
      DATABASE_URL: postgresql://blockscout:blockscout@postgres:5432/blockscout
      ETHEREUM_JSONRPC_HTTP_URL: http://geth:8545
    depends_on:
      - postgres
      - geth
    networks:
      - blockscout

  backend:
    image: blockscout/blockscout-backend:latest
    container_name: blockscout-backend
    environment:
      DATABASE_URL: postgresql://blockscout:blockscout@postgres:5432/blockscout
    depends_on:
      - postgres
    networks:
      - blockscout

  frontend:
    image: blockscout/blockscout-frontend:latest
    container_name: blockscout-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_HOST: http://localhost:4000
    depends_on:
      - backend
    networks:
      - blockscout

networks:
  blockscout:

volumes:
  pgdata:
```

<img width="960" height="193" alt="blockscout" src="https://github.com/user-attachments/assets/67cc60a1-6644-440d-8930-b9a9817c4988" />












