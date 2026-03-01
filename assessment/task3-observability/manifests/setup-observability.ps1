# ===============================
# Hirelink Observability Setup
# Production GKE Automated Script
# ===============================

$NAMESPACE="observability"
$GRAFANA_PASSWORD="StrongPassword123"
$DOMAIN="monitor.niranjan.cloud"

Write-Host "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

Write-Host "Installing kube-prometheus-stack..."
helm upgrade --install kube-prom-stack prometheus-community/kube-prometheus-stack `
  --namespace $NAMESPACE `
  --set grafana.adminPassword=$GRAFANA_PASSWORD `
  --set grafana.service.type=ClusterIP

Write-Host "Installing Loki..."
helm upgrade --install loki grafana/loki-stack `
  --namespace $NAMESPACE

Write-Host "Installing Blackbox Exporter..."
helm upgrade --install blackbox prometheus-community/prometheus-blackbox-exporter `
  --namespace $NAMESPACE

Write-Host "Waiting for pods to be ready..."
kubectl rollout status deployment/kube-prom-stack-grafana -n $NAMESPACE --timeout=300s

Write-Host "Applying custom observability manifests..."
kubectl apply -k .

Write-Host "Creating Managed Certificate for Grafana..."
@"
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: monitor-cert
  namespace: $NAMESPACE
spec:
  domains:
    - $DOMAIN
"@ | kubectl apply -f -

Write-Host "Creating Grafana Ingress..."
@"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: "monitor-cert"
spec:
  ingressClassName: gce
  rules:
    - host: $DOMAIN
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: kube-prom-stack-grafana
                port:
                  number: 80
"@ | kubectl apply -f -

Write-Host "==========================================="
Write-Host "Observability setup complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Get Ingress IP:"
Write-Host "   kubectl get ingress -n observability"
Write-Host ""
Write-Host "2) Add DNS A record:"
Write-Host "   monitor -> <INGRESS_IP>"
Write-Host ""
Write-Host "3) Wait for certificate to become ACTIVE:"
Write-Host "   kubectl describe managedcertificate monitor-cert -n observability"
Write-Host ""
Write-Host "4) Access:"
Write-Host "   https://$DOMAIN"
Write-Host ""
Write-Host "Grafana Login:"
Write-Host "Username: admin"
Write-Host "Password: $GRAFANA_PASSWORD"
Write-Host "==========================================="