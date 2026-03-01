variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Primary region for GKE, GAR, and Cloud SQL."
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "GKE Autopilot cluster name."
  type        = string
  default     = "hirelink-prod-cluster"
}

variable "network_name" {
  description = "VPC network name for GKE."
  type        = string
  default     = "hirelink-vpc"
}

variable "subnetwork_name" {
  description = "Subnetwork name for GKE."
  type        = string
  default     = "hirelink-subnet"
}

variable "subnetwork_cidr" {
  description = "Subnetwork CIDR range."
  type        = string
  default     = "10.10.0.0/20"
}

variable "artifact_registry_repository" {
  description = "Artifact Registry Docker repository ID."
  type        = string
  default     = "hirelink"
}

variable "namespace" {
  description = "Kubernetes namespace where workloads run."
  type        = string
  default     = "hirelink-prod"
}

variable "k8s_service_account_name" {
  description = "Kubernetes service account used by API deployment."
  type        = string
  default     = "hirelink-ksa"
}

variable "workload_gsa_account_id" {
  description = "GCP service account ID (without @project suffix)."
  type        = string
  default     = "sa-hirelink-workload-prod"
}

variable "ingress_static_ip_name" {
  description = "Reserved global static IP name used by GKE ingress."
  type        = string
  default     = "hirelink-ingress-ip"
}

variable "ssl_certificate_name" {
  description = "Name of Google-managed SSL certificate."
  type        = string
  default     = "hirelink-managed-cert"
}

variable "app_domain" {
  description = "Frontend domain for ingress certificate."
  type        = string
  default     = "app.niranjan.cloud"
}

variable "api_domain" {
  description = "API domain for ingress certificate."
  type        = string
  default     = "api.niranjan.cloud"
}

variable "create_dns_records" {
  description = "Create Cloud DNS A records for app_domain and api_domain to ingress static IP."
  type        = bool
  default     = false
}

variable "dns_managed_zone" {
  description = "Cloud DNS managed zone name (required when create_dns_records = true)."
  type        = string
  default     = ""
}

variable "create_dns_zone" {
  description = "Create Cloud DNS managed zone (set true if the zone does not already exist)."
  type        = bool
  default     = false
}

variable "dns_zone_dns_name" {
  description = "Cloud DNS zone DNS name (must end with a dot), e.g. niranjan.cloud."
  type        = string
  default     = ""
}

variable "dns_zone_description" {
  description = "Cloud DNS managed zone description."
  type        = string
  default     = "Hirelink public DNS zone"
}

variable "dns_ttl" {
  description = "TTL for Cloud DNS A records."
  type        = number
  default     = 300
}

variable "create_cloud_sql" {
  description = "Manage Cloud SQL PostgreSQL instance through Terraform."
  type        = bool
  default     = true
}

variable "manage_cloud_sql_database_and_user" {
  description = "Manage Cloud SQL database and user resources (disable for existing manually managed DB users)."
  type        = bool
  default     = false
}

variable "cloud_sql_instance_name" {
  description = "Cloud SQL instance name."
  type        = string
  default     = "hirelink-production-db"
}

variable "cloud_sql_database_name" {
  description = "Cloud SQL database name."
  type        = string
  default     = "hirelink-production-db"
}

variable "cloud_sql_username" {
  description = "Cloud SQL application username."
  type        = string
  default     = "hirelink_app"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier."
  type        = string
  default     = "db-custom-1-3840"
}

variable "cloud_sql_database_version" {
  description = "Cloud SQL database engine major version."
  type        = string
  default     = "POSTGRES_18"
}

variable "cloud_sql_enable_public_ip" {
  description = "Enable public IPv4 on Cloud SQL. Keep false for private-only access."
  type        = bool
  default     = false
}

variable "cloud_sql_private_service_range_name" {
  description = "Reserved range name used for private services VPC peering."
  type        = string
  default     = "hirelink-sql-private-range"
}

variable "cloud_sql_private_service_range_prefix_length" {
  description = "CIDR prefix length for private services reserved range."
  type        = number
  default     = 16
}

variable "cloud_sql_deletion_protection" {
  description = "Enable deletion protection for Cloud SQL instance."
  type        = bool
  default     = true
}

variable "cloud_sql_maintenance_window_day" {
  description = "Cloud SQL maintenance day (1=Monday ... 7=Sunday)."
  type        = number
  default     = 7
}

variable "cloud_sql_maintenance_window_hour" {
  description = "Cloud SQL maintenance hour in UTC (0-23)."
  type        = number
  default     = 3
}

variable "cloud_sql_maintenance_window_update_track" {
  description = "Cloud SQL maintenance update track."
  type        = string
  default     = "stable"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on managed resources."
  type        = bool
  default     = false
}
