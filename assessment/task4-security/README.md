# Task 4: Security Hardening

This task enforces defense-in-depth across access control, runtime hardening, secret handling, and supply chain policy.

## Implemented Controls

- **RBAC (least privilege)**: `manifests/rbac.yaml`
  - Roles for `developer`, `operator`, `admin`
  - Explicit group bindings (`hirelink-developers`, `hirelink-operators`, `hirelink-admins`)
  - Dedicated `cicd-deployer` service account with scoped deploy permissions
- **Pod Security**:
  - Namespace-level PSS `restricted` labels in Task 1 namespace manifest
  - Runtime security contexts in backend/frontend deployments (non-root, drop caps, read-only rootfs, seccomp)
- **Kyverno policy-as-code**: `manifests/kyverno-policies.yaml`
  - Disallow privileged containers
  - Require read-only root filesystem
  - Require `runAsNonRoot`
  - Disallow `hostNetwork` / `hostPID` / `hostIPC`
  - Require `seccompProfile: RuntimeDefault`
  - Verify signed images policy (Cosign public key placeholder)
- **Secrets Management**: `manifests/secretproviderclass.yaml`
  - Pulls runtime secrets from GCP Secret Manager
  - Syncs to Kubernetes secret `hirelink-secret-env` for app env consumption
- **Network Segmentation**:
  - Default deny + explicit allow-list policies are in `task1-gke/k8s/base/10-networkpolicy.yaml`
- **TLS/mTLS**:
  - Edge TLS via GKE managed certificate + HTTPS ingress
  - Optional service-to-service strict mTLS profile in `manifests/istio-mtls-example.yaml` (apply only when Istio is installed)
- **CI Security**:
  - Trivy scanning is already integrated in Task 2 workflow

## Install / Apply

### 1) Install policy and secrets components

```bash
# Kyverno
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace

# Secrets Store CSI Driver + GCP provider
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm upgrade --install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
  -n kube-system
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/secrets-store-csi-driver-provider-gcp/main/deploy/provider-gcp-plugin.yaml
```

### 2) Apply hardening manifests

```bash
kubectl apply -k assessment/task4-security/manifests
```

### 3) (Optional) Enable strict mTLS with Istio

```bash
kubectl apply -f assessment/task4-security/manifests/istio-mtls-example.yaml
```

## Verification Commands

```bash
kubectl -n hirelink-prod get role,rolebinding,sa
kubectl get clusterpolicy
kubectl -n hirelink-prod get secretproviderclass
kubectl -n hirelink-prod get secret hirelink-secret-env
kubectl -n hirelink-prod auth can-i patch deployment --as=system:serviceaccount:hirelink-prod:cicd-deployer
```

## Supply Chain Signing Flow (Cosign)

```bash
# CI step example
cosign sign --key $COSIGN_PRIVATE_KEY us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-api:${IMAGE_TAG}
cosign sign --key $COSIGN_PRIVATE_KEY us-central1-docker.pkg.dev/deadbots/hirelink/hirelink-web:${IMAGE_TAG}
```

Then replace `REPLACE_WITH_COSIGN_PUBLIC_KEY` in `kyverno-policies.yaml` and switch `validationFailureAction` to `Enforce` after successful validation in staging.

## Residual Security Backlog

1. Add Falco runtime detection with Slack/PagerDuty routing.
2. Enable periodic CIS scans (`kube-bench`) and store reports in CI artifacts.
3. Enable Kubernetes API audit log export to Cloud Logging sink for long-term retention.

