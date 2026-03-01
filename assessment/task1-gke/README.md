# Task 1: GKE Secure Deployment Flow

This deployment includes:

- `hirelink-web` (Next.js frontend)
- `hirelink-api` (Django backend)
- Cloud SQL PostgreSQL via private IP

## Architecture

```mermaid
flowchart LR
  U[Users] --> DNS[Cloud DNS]
  DNS --> LB[GKE HTTP(S) Load Balancer Ingress]
  LB --> FE[hirelink-web Deployment]
  LB --> API[hirelink-api Deployment]
  FE --> API
  API --> SQL[(Cloud SQL PostgreSQL Private IP)]
  API --> GSM[Secret Manager]
  GSM -. Workload Identity .-> GSA[GCP Service Account]
```

## Runtime Traffic Flow (Application LB)

1. User hits `app.niranjan.cloud` or `api.niranjan.cloud`.
2. DNS resolves to global static IP (`hirelink-ingress-ip`).
3. GKE Ingress (`hirelink-ingress`) uses Google Cloud HTTP(S) Load Balancer.
4. LB routes host-based traffic:
   - `app.niranjan.cloud` -> `hirelink-web` service (`ClusterIP:80`)
   - `api.niranjan.cloud` -> `hirelink-api` service (`ClusterIP:8000`)
5. Services route to healthy pods selected by labels.

This is the standard long-term L7 application LB pattern on GKE.

## 1) Prerequisites

- Tools: `gcloud`, `kubectl`, `docker`
- GCP project (example): `deadbots`
- Required APIs:
  - `container.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `sqladmin.googleapis.com`
  - `secretmanager.googleapis.com`
  - `iamcredentials.googleapis.com`
  - `compute.googleapis.com`

Enable APIs:

```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  compute.googleapis.com \
  --project deadbots
```

## 2) Provision GKE + Registry

```bash
gcloud config set project deadbots

gcloud container clusters create-auto hirelink-prod-cluster \
  --region us-central1

gcloud artifacts repositories create hirelink \
  --repository-format=docker \
  --location=us-central1
```

## 3) Build and Push Images

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
IMAGE_TAG=v1.1.1

cd hirelink-api
docker build -t us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-api:${IMAGE_TAG} .
docker push us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-api:${IMAGE_TAG}

cd ../hirelink
docker build -t us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-web:${IMAGE_TAG} .
docker push us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-web:${IMAGE_TAG}
```

## 4) Configure Workload Identity

Create GSA:

```bash
gcloud iam service-accounts create sa-hirelink-workload-prod \
  --display-name="HireLink GKE Workload Prod"
```

Grant least-privilege secret access:

```bash
gcloud projects add-iam-policy-binding deadbots \
  --member="serviceAccount:sa-hirelink-workload-prod@deadbots.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Bind KSA (`hirelink-ksa`) to GSA:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  sa-hirelink-workload-prod@deadbots.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:deadbots.svc.id.goog[hirelink-prod/hirelink-ksa]"
```

## 5) Configure TLS Certificate for Ingress

Ingress expects a pre-shared certificate named `hirelink-managed-cert`:

```bash
gcloud compute ssl-certificates create hirelink-managed-cert \
  --domains=app.niranjan.cloud,api.niranjan.cloud \
  --global \
  --project deadbots
```

Check status:

```bash
gcloud compute ssl-certificates describe hirelink-managed-cert --global --project deadbots
```

## 5.1) Domain Mapping (When DNS Is Managed By Your Hoster)

Create these DNS records at your registrar/hoster:

- `A` record: `app.niranjan.cloud` -> `34.13.122.211`
- `A` record: `api.niranjan.cloud` -> `34.13.122.211`

Recommended:

- TTL `300`
- Do not create conflicting `AAAA` records unless you also map IPv6 correctly.
- If using Cloudflare, keep records in `DNS only` mode until certificate is `ACTIVE`.

If certificate shows `FAILED_NOT_VISIBLE`, verify:

```bash
nslookup app.niranjan.cloud
nslookup api.niranjan.cloud
gcloud compute ssl-certificates describe hirelink-managed-cert --global --project deadbots --format="get(managed.status,managed.domainStatus)"
```

## 6) Deploy (Scripted)

From `hirelink-api`:

```powershell
.\assessment\task1-gke\deploy-gke.ps1 `
  -ProjectId deadbots `
  -Region us-central1 `
  -ClusterName hirelink-prod-cluster `
  -RepoName hirelink `
  -BackendImageTag v1.1.1 `
  -FrontendImageTag v1.1.1
```

## Terraform (Complete Infra)

Provision full GCP infra using Terraform from:

`assessment/task1-gke/terraform`

```bash
cd assessment/task1-gke/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

If Cloud SQL already exists (for example `deadbots:us-central1:hirelink-production-db`), import it before apply so Terraform modifies it in place and disables public IP:

```bash
cd assessment/task1-gke/terraform
terraform import 'google_sql_database_instance.postgres[0]' 'projects/deadbots/instances/hirelink-production-db'
terraform apply
```

## 7) Verify

```bash
kubectl -n hirelink-prod get pods,svc,ingress,hpa,pdb,networkpolicy
kubectl -n hirelink-prod get events --sort-by=.metadata.creationTimestamp | tail -n 20
kubectl -n hirelink-prod logs deploy/hirelink-api -c app --tail=100
```

## Secret Manager Values (Direct Private IP Mode)

Use these runtime values for backend DB connectivity:

- `USE_CLOUD_SQL_PROXY_PROD=false`
- `DB_HOST_PROD=10.114.0.4`
- `DB_PORT_PROD=5432`
- `DB_SSLMODE_PROD=require`
- `CLOUD_SQL_CONNECTION_NAME_PROD=deadbots:us-central1:hirelink-production-db` (can stay for compatibility)

`02-configmap.yaml` intentionally does not store these runtime DB/GCP keys. Secret Manager is the source of truth.

## Scaling Model (What Scales and How)

Scaling is configured directly in Kubernetes manifests:

- Pod autoscaling (HPA): `k8s/base/08-hpa.yaml`
  - `hirelink-api`: min `2`, max `6`, scale on CPU `70%` and memory `75%`
  - `hirelink-web`: min `2`, max `4`, scale on CPU `70%` and memory `75%`
- Pod availability during node drain/restart (PDB): `k8s/base/09-pdb.yaml`
  - `minAvailable: 1` for API and frontend
- Safe rolling updates (Deployment strategy): `k8s/base/04-backend-deployment.yaml`, `k8s/base/05-frontend-deployment.yaml`
  - `maxUnavailable: 0`, `maxSurge: 1`
- Cluster/node scaling:
  - GKE Autopilot handles node capacity automatically when pods scale.

Observe autoscaling live:

```bash
kubectl -n hirelink-prod get hpa -w
kubectl -n hirelink-prod top pods
```

Manual emergency scale (if needed):

```bash
kubectl -n hirelink-prod scale deploy/hirelink-api --replicas=4
kubectl -n hirelink-prod scale deploy/hirelink-web --replicas=3
```

Re-enable HPA control after manual override:

```bash
kubectl -n hirelink-prod rollout restart deploy/hirelink-api
kubectl -n hirelink-prod rollout restart deploy/hirelink-web
```

## Security Standards Applied

- Pod Security Standards `restricted` at namespace level
- Non-root containers, dropped capabilities, `seccompProfile: RuntimeDefault`
- Read-only root filesystem for frontend/backend with explicit writable mounts
- Split service accounts: API workload identity enabled, frontend token disabled
- Default deny NetworkPolicy with explicit ingress/egress allow-lists
- GKE L7 HTTP(S) load balancer with forced HTTP->HTTPS redirect via `FrontendConfig`
- Cloud CDN enabled on frontend backend-service path (`hirelink-web`) using `BackendConfig`
- HPA + PDB for availability during scaling and voluntary disruptions

## Notes

- Cloud SQL is the production DB path for this task.
- This setup uses direct private IP DB connectivity (`10.114.0.4:5432`) instead of sidecar proxy.
- Kubernetes secret template removed. Runtime secrets are read from GCP Secret Manager via Workload Identity.

## Quick Commands (Future Reference)

```powershell
# 1) Cluster auth
gcloud container clusters get-credentials hirelink-prod-cluster --region us-central1 --project deadbots

# 2) Secret Manager (direct private IP DB mode)
echo false | gcloud secrets versions add USE_CLOUD_SQL_PROXY_PROD --data-file=-
echo 10.114.0.4 | gcloud secrets versions add DB_HOST_PROD --data-file=-
echo 5432 | gcloud secrets versions add DB_PORT_PROD --data-file=-
echo require | gcloud secrets versions add DB_SSLMODE_PROD --data-file=-
echo deadbots:us-central1:hirelink-production-db | gcloud secrets versions add CLOUD_SQL_CONNECTION_NAME_PROD --data-file=-

# 3) Build + push images
gcloud auth configure-docker us-central1-docker.pkg.dev
$IMAGE_TAG="v1.1.1"

cd D:\cloud-native-platform\hirelink-api
docker build -t us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-api:$IMAGE_TAG .
docker push us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-api:$IMAGE_TAG

cd D:\cloud-native-platform\hirelink
docker build -t us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-web:$IMAGE_TAG .
docker push us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-web:$IMAGE_TAG

# 4) Deploy workloads
cd D:\cloud-native-platform\hirelink-api
.\assessment\task1-gke\deploy-gke.ps1 -ProjectId deadbots -Region us-central1 -ClusterName hirelink-prod-cluster -RepoName hirelink -BackendImageTag $IMAGE_TAG -FrontendImageTag $IMAGE_TAG

# 5) Verify
kubectl -n hirelink-prod get pods,svc,ingress,hpa,pdb,networkpolicy
kubectl -n hirelink-prod logs deploy/hirelink-api -c app --tail=100
```

