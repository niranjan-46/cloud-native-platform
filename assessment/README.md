# Dodo Payments DevOps & Security Assessment

This folder contains an implementation-ready blueprint for deploying HireLink on GCP/GKE and mapping deliverables to Tasks 1-5.

## Folder Layout

- `task1-gke/`: Kubernetes setup and deployment manifests (frontend + backend + DB pattern).
  - Includes Terraform infra under `task1-gke/terraform`.
- `task2-cicd/`: CI/CD and GitOps workflow templates.
- `task3-observability/`: Monitoring, logging, tracing plan and alert rules.
- `task4-security/`: RBAC, policy, network security, and secrets patterns.
- `task5-istio-answers.md`: Written answers for Istio knowledge assessment.

## Current Architecture Assumption

- Frontend: Next.js (`hirelink`) container on port `3000`.
- Backend: Django (`hirelink-api`) container on port `8000`.
- Database: Cloud SQL PostgreSQL (`deadbots:us-central1:hirelink-production-db`) via private IP (`10.114.0.4:5432`).
- Secrets: GCP Secret Manager + Workload Identity.
- Ingress/LB: GKE HTTP(S) Load Balancer with host routing:
  - `app.niranjan.cloud` -> frontend service
  - `api.niranjan.cloud` -> backend service

## Fast Start (Task 1)

1. Follow `task1-gke/README.md` and create the GKE cluster + Artifact Registry.
2. Build and push backend/frontend images.
3. Apply manifests under `task1-gke/k8s/base`.
4. Verify:
   - Backend health endpoint: `/health/`
   - Frontend route: `/`
   - HPA/PDB/NetworkPolicy resources are active.

## Fast Start (Task 3 + Task 4)

1. Observability stack:
   - Follow `task3-observability/README.md`
   - Install `kube-prometheus-stack`, `loki`, `tempo`, and `blackbox-exporter`
   - Apply: `kubectl apply -k assessment/task3-observability/manifests`
2. Security hardening controls:
   - Follow `task4-security/README.md`
   - Install `kyverno` + `secrets-store-csi-driver` (+ GCP provider)
   - Apply: `kubectl apply -k assessment/task4-security/manifests`
