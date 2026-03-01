# Task 4: Security Hardening

## Controls Implemented

- RBAC roles for developers/operators/admins (`manifests/rbac.yaml`)
- Namespace Pod Security `restricted` labels (Task 1 namespace)
- Network segmentation (`task1-gke/k8s/base/10-networkpolicy.yaml`)
- Policy as code sample with Kyverno (`manifests/kyverno-policies.yaml`)
- Secret retrieval pattern from GCP Secret Manager (`manifests/secretproviderclass.yaml`)
- Non-root containers + dropped Linux capabilities in deployments
- CI image scanning using Trivy in Task 2 workflow

## Notes

- For strict runtime policy enforcement, install Kyverno or Gatekeeper in cluster.
- For image signing, add Cosign step in CI:
  - `cosign sign --key $KEY_REF $IMAGE_URI`
- For runtime threat detection:
  - Deploy Falco and alert to Slack/PagerDuty.
- For compliance:
  - Run kube-bench and kube-hunter in non-prod first.

