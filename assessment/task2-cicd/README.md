# Task 2: CI/CD Pipeline

This task includes production-oriented GitHub Actions workflows for backend and frontend build/test/scan/deploy to GKE.

## Included

- Backend workflow: `hirelink-api/.github/workflows/backend-cicd.yml`
- Frontend workflow (actual): `hirelink/.github/workflows/frontend-cicd.yml`
- Frontend template (for reuse): `assessment/task2-cicd/frontend-cicd-template.yml`
- Pipeline stages:
  - Lint/static checks (`manage.py check`)
  - Unit tests / frontend tests
  - Docker build + push to Artifact Registry
  - Trivy image vulnerability scan
  - Deploy to GKE and wait for rollout (staging + production)
  - Rollback on failure

## Required GitHub Secrets

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GKE_CLUSTER`
- `GKE_LOCATION`
- `GAR_LOCATION` (e.g., `us-central1`)
- `GAR_REPOSITORY` (e.g., `hirelink`)

## Recommended GitHub Variables

- `K8S_NAMESPACE_STAGING` (default fallback: `hirelink-staging`)
- `K8S_NAMESPACE_PRODUCTION` (default fallback: `hirelink-prod`)

## Deployment Flow Standard

1. PR runs quality gates (lint/tests/build).
2. Push to `develop` deploys `staging`.
3. Push to `main` deploys `production`.
4. Manual `workflow_dispatch` can deploy to either `staging` or `production`.
5. Trivy blocks vulnerable images (`HIGH`, `CRITICAL`).
6. Pipeline pushes immutable tag `${{ github.sha }}` to GAR.
7. Pipeline updates GKE deployment image and waits for rollout.
8. Automatic rollback executes on rollout failure.

## Branch Protection (Recommended)

- Protect `main`:
  - Require pull request.
  - Require passing checks.
  - Require at least 1 review approval.
  - Block force-push and deletions.

## GitOps Option

- For strict GitOps, replace direct `kubectl set image` with manifest repo updates.
- ArgoCD/Flux should reconcile image tags from a separate environment repo.
