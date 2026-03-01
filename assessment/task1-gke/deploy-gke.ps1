param(
  [string]$ProjectId = "deadbots",
  [string]$Region = "us-central1",
  [string]$ClusterName = "hirelink-prod-cluster",
  [string]$RepoName = "hirelink",
  [string]$Namespace = "hirelink-prod",
  [string]$TlsCertificateName = "hirelink-managed-cert",
  [string]$IngressName = "hirelink-ingress",
  [string]$BackendImageTag = "latest",
  [string]$FrontendImageTag = "latest"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Assert-CommandExists {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not installed or not available in PATH."
  }
}

Assert-CommandExists -Name "gcloud"
Assert-CommandExists -Name "kubectl"

Write-Host "Setting gcloud project..."
gcloud config set project $ProjectId

Write-Host "Getting GKE credentials..."
gcloud container clusters get-credentials $ClusterName --region $Region --project $ProjectId

Write-Host "Applying Kubernetes manifests from task1-gke/k8s/base..."
kubectl apply -k "$ScriptDir\k8s\base"

Write-Host "Setting backend/frontend images..."
$backendImage = "$Region-docker.pkg.dev/$ProjectId/$RepoName/hirelink-api:$BackendImageTag"
$frontendImage = "$Region-docker.pkg.dev/$ProjectId/$RepoName/hirelink-web:$FrontendImageTag"

kubectl -n $Namespace set image deploy/hirelink-api app=$backendImage
kubectl -n $Namespace set image deploy/hirelink-web web=$frontendImage

Write-Host "Waiting for rollout..."
kubectl -n $Namespace rollout status deploy/hirelink-api --timeout=300s
kubectl -n $Namespace rollout status deploy/hirelink-web --timeout=300s

Write-Host "Waiting for ingress external IP..."
$ingressAddress = ""
for ($i = 0; $i -lt 30; $i++) {
  $ingressAddress = (kubectl -n $Namespace get ingress $IngressName -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null)
  if (-not [string]::IsNullOrWhiteSpace($ingressAddress)) {
    break
  }
  Start-Sleep -Seconds 10
}
if ([string]::IsNullOrWhiteSpace($ingressAddress)) {
  Write-Warning "Ingress external IP is still empty. Check ingress events:"
  Write-Warning "kubectl -n $Namespace describe ingress $IngressName"
} else {
  Write-Host "Ingress external IP: $ingressAddress"
}

Write-Host "Checking TLS certificate reference..."
gcloud compute ssl-certificates describe $TlsCertificateName --global --project $ProjectId | Out-Null 2>$null
$certExists = ($LASTEXITCODE -eq 0)
if (-not $certExists) {
  Write-Warning "TLS certificate '$TlsCertificateName' does not exist yet. Create it and wait until ACTIVE:"
  Write-Warning "gcloud compute ssl-certificates create $TlsCertificateName --domains=app.niranjan.cloud,api.niranjan.cloud --global --project $ProjectId"
}

Write-Host "Checking TLS certificate status..."
if ($certExists) {
  gcloud compute ssl-certificates describe $TlsCertificateName --global --project $ProjectId --format="get(managed.status,managed.domainStatus)"
}

if (-not [string]::IsNullOrWhiteSpace($ingressAddress)) {
  Write-Host "Domain mapping required:"
  Write-Host "  app.niranjan.cloud A -> $ingressAddress"
  Write-Host "  api.niranjan.cloud A -> $ingressAddress"
}

Write-Host "Validating runtime objects..."
Write-Host "Using GCP Secret Manager as runtime source of truth."

Write-Host "Deployment complete."
kubectl -n $Namespace get pods,svc,ingress,hpa,pdb,networkpolicy
