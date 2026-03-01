output "gke_cluster_name" {
  description = "Created GKE cluster name."
  value       = google_container_cluster.primary.name
}

output "gke_get_credentials_command" {
  description = "Command to configure local kubectl context."
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${var.region} --project ${var.project_id}"
}

output "workload_gsa_email" {
  description = "Workload Identity GSA email to use in KSA annotation."
  value       = google_service_account.workload.email
}

output "workload_identity_member_binding" {
  description = "Workload Identity member principal bound to the GSA."
  value       = local.workload_identity_member
}

output "artifact_registry_repository" {
  description = "Artifact Registry Docker repository path prefix."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "ingress_static_ip_address" {
  description = "Reserved ingress global static IP."
  value       = google_compute_global_address.ingress.address
}

output "ssl_certificate_name" {
  description = "Pre-shared certificate name for ingress annotation."
  value       = google_compute_managed_ssl_certificate.ingress.name
}

output "dns_managed_zone_name" {
  description = "Cloud DNS managed zone name used for records."
  value       = var.create_dns_zone ? google_dns_managed_zone.primary[0].name : var.dns_managed_zone
}

output "dns_name_servers" {
  description = "Cloud DNS managed zone name servers (set at domain registrar if zone was created here)."
  value       = var.create_dns_zone ? google_dns_managed_zone.primary[0].name_servers : null
}

output "app_dns_record_fqdn" {
  description = "Cloud DNS FQDN created for app domain (if enabled)."
  value       = length(google_dns_record_set.app_domain) > 0 ? google_dns_record_set.app_domain[0].name : null
}

output "api_dns_record_fqdn" {
  description = "Cloud DNS FQDN created for api domain (if enabled)."
  value       = length(google_dns_record_set.api_domain) > 0 ? google_dns_record_set.api_domain[0].name : null
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name."
  value       = var.create_cloud_sql ? google_sql_database_instance.postgres[0].connection_name : null
}

output "cloud_sql_app_username" {
  description = "Generated Cloud SQL app username."
  value       = var.create_cloud_sql && var.manage_cloud_sql_database_and_user ? google_sql_user.app[0].name : null
}

output "cloud_sql_app_password" {
  description = "Generated Cloud SQL app password."
  value       = var.create_cloud_sql && var.manage_cloud_sql_database_and_user ? random_password.cloud_sql_app_password[0].result : null
  sensitive   = true
}
