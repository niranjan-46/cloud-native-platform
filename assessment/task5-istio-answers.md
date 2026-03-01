# Task 5: Istio Service Mesh (Knowledge Assessment)

This document answers the five Istio theory questions from the assessment.

## 1) Role of Istio in Kubernetes and Sidecar Model

Istio is a service mesh that adds a dedicated networking and security layer for microservices running on Kubernetes.

In the sidecar model, each application pod gets an Envoy proxy container injected beside the app container. Inbound and outbound traffic is intercepted by Envoy, so Istio can apply platform-level controls without changing application code.

Problems this solves compared to app-level networking:

- Consistent mTLS across services without custom TLS code in each service
- Centralized traffic policies (timeouts, retries, circuit breaking, fault injection)
- Fine-grained access control based on workload identity
- Standardized observability (metrics, traces, access logs) at service boundaries

## 2) PeerAuthentication vs AuthorizationPolicy and Strict mTLS

`PeerAuthentication` and `AuthorizationPolicy` solve different concerns:

- `PeerAuthentication`: defines whether a workload accepts plaintext or mTLS traffic (`STRICT`, `PERMISSIVE`, `DISABLE`)
- `AuthorizationPolicy`: defines which authenticated identities can call which workloads and operations

To enforce strict mTLS for a namespace:

1. Apply namespace-level `PeerAuthentication` with `mtls.mode: STRICT`
2. Use `DestinationRule` with `tls.mode: ISTIO_MUTUAL` for service-to-service client policy
3. Add `AuthorizationPolicy` rules (default deny + explicit allow) using service accounts/namespaces

Example:

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: hirelink
spec:
  mtls:
    mode: STRICT
```

## 3) Istio Traffic Management and Canary Deployment

Istio traffic management uses:

- `DestinationRule` to define named subsets (for example `v1`, `v2`) from pod labels
- `VirtualService` to route traffic to subsets with weighted percentages and routing rules

Canary rollout flow:

1. Deploy two versions (`v1`, `v2`) of the same service
2. Create `DestinationRule` subsets mapping to `version: v1` and `version: v2`
3. Start with low canary weight (for example 95/5)
4. Monitor error rate, latency, saturation, and business KPIs
5. Gradually shift weights (80/20 -> 50/50 -> 0/100)
6. Roll back immediately by routing 100% traffic back to `v1` if signals degrade

## 4) Istio Ingress Gateway vs Kubernetes Ingress Controller

Kubernetes Ingress Controller mainly handles north-south HTTP(S) routing based on Ingress resources.

Istio Ingress Gateway is an Envoy-based gateway managed by Istio and integrated with mesh-level security, policy, and telemetry.

Key differences:

- Istio gateway aligns external traffic with the same mesh identity/policy model
- Supports advanced routing/canary behavior through `Gateway` + `VirtualService`
- Provides richer traffic policy controls and consistent observability with internal service traffic

## 5) Istio Observability Integrations

Istio improves observability by collecting telemetry at the proxy layer (Envoy), independent of app language/framework.

Typical integration path:

- Metrics: Envoy/Istio standard metrics scraped by Prometheus
- Dashboards: Grafana visualizes service-level RED metrics (rate, errors, duration) and mesh health
- Tracing: Envoy-generated spans exported to Jaeger/Zipkin/Tempo
- Logs: Envoy access logs correlate requests across services

Relevant Istio components:

- `istiod` (control plane: config distribution, service discovery, certificates)
- Envoy sidecars (data plane telemetry and policy enforcement)
- Istio ingress/egress gateways (edge telemetry and routing)

This gives consistent monitoring and troubleshooting for both service-to-service and ingress traffic.
