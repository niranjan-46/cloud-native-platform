# Task 3: Monitoring, Logging & Observability

## Stack Choice

- Metrics: Prometheus + Grafana (`kube-prometheus-stack`)
- Logs: Loki + Promtail + Grafana
- Traces: Tempo (or Jaeger as alternative)

## Installation (Helm)

```bash
kubectl create ns observability

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install kube-prom-stack prometheus-community/kube-prometheus-stack \
  -n observability

helm upgrade --install loki grafana/loki-stack \
  -n observability \
  --set promtail.enabled=true \
  --set grafana.enabled=false
```

## Included Manifests

- `manifests/servicemonitor.yaml`: app service discovery for Prometheus.
- `manifests/prometheus-rules.yaml`: alert rules (high error rate, restarts, CPU/memory pressure).

## SLI/SLO Proposal

- API availability SLI: successful requests / total requests
  - SLO: 99.9% monthly
- API latency SLI: p95 request latency
  - SLO: p95 < 500ms
- Pod health SLI: ready pods / desired pods
  - SLO: 99.5%

## Runbooks

- `CrashLoopBackOff`: inspect logs/events, check env/secret mount, roll back image.
- `High 5xx`: verify DB connectivity, app exceptions, and recent deploy.
- `CPU saturation`: verify HPA and increase limits/replicas.

