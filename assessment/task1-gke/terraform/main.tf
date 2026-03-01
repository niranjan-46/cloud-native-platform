locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "dns.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "servicenetworking.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "sqladmin.googleapis.com"
  ])

  workload_identity_member = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.k8s_service_account_name}]"
}

resource "google_project_service" "required" {
  for_each           = local.required_services
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_compute_network" "gke" {
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "gke" {
  name                     = var.subnetwork_name
  region                   = var.region
  network                  = google_compute_network.gke.id
  ip_cidr_range            = var.subnetwork_cidr
  private_ip_google_access = true
}

resource "google_compute_global_address" "private_services_range" {
  count         = var.create_cloud_sql ? 1 : 0
  name          = var.cloud_sql_private_service_range_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.cloud_sql_private_service_range_prefix_length
  network       = google_compute_network.gke.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  count                   = var.create_cloud_sql ? 1 : 0
  network                 = google_compute_network.gke.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services_range[0].name]
  depends_on              = [google_project_service.required]
}

resource "google_container_cluster" "primary" {
  name                = var.cluster_name
  location            = var.region
  enable_autopilot    = true
  deletion_protection = var.enable_deletion_protection
  network             = google_compute_network.gke.id
  subnetwork          = google_compute_subnetwork.gke.id

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  ip_allocation_policy {}

  depends_on = [google_project_service.required]
}

resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = var.artifact_registry_repository
  format        = "DOCKER"
  description   = "Hirelink container images"

  depends_on = [google_project_service.required]
}

resource "google_service_account" "workload" {
  account_id   = var.workload_gsa_account_id
  display_name = "HireLink workload identity service account"
}

resource "google_project_iam_member" "workload_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.workload.email}"
}

resource "google_project_iam_member" "workload_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.workload.email}"
}

resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.workload.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.workload_identity_member
  depends_on         = [google_container_cluster.primary]
}

resource "google_compute_global_address" "ingress" {
  name = var.ingress_static_ip_name
}

resource "google_compute_managed_ssl_certificate" "ingress" {
  name = var.ssl_certificate_name
  managed {
    domains = [var.app_domain, var.api_domain]
  }

  depends_on = [google_project_service.required]
}

resource "google_dns_managed_zone" "primary" {
  count       = var.create_dns_zone ? 1 : 0
  name        = var.dns_managed_zone
  dns_name    = var.dns_zone_dns_name
  description = var.dns_zone_description

  depends_on = [google_project_service.required]
}

resource "google_dns_record_set" "app_domain" {
  count        = var.create_dns_records && (var.create_dns_zone || var.dns_managed_zone != "") ? 1 : 0
  managed_zone = var.create_dns_zone ? google_dns_managed_zone.primary[0].name : var.dns_managed_zone
  name         = "${var.app_domain}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_global_address.ingress.address]

  depends_on = [google_project_service.required, google_dns_managed_zone.primary]
}

resource "google_dns_record_set" "api_domain" {
  count        = var.create_dns_records && (var.create_dns_zone || var.dns_managed_zone != "") ? 1 : 0
  managed_zone = var.create_dns_zone ? google_dns_managed_zone.primary[0].name : var.dns_managed_zone
  name         = "${var.api_domain}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_global_address.ingress.address]

  depends_on = [google_project_service.required, google_dns_managed_zone.primary]
}

resource "random_password" "cloud_sql_app_password" {
  count            = var.create_cloud_sql && var.manage_cloud_sql_database_and_user ? 1 : 0
  length           = 24
  special          = true
  override_special = "_%@"
}

resource "google_sql_database_instance" "postgres" {
  count               = var.create_cloud_sql ? 1 : 0
  name                = var.cloud_sql_instance_name
  region              = var.region
  database_version    = var.cloud_sql_database_version
  deletion_protection = var.cloud_sql_deletion_protection

  settings {
    tier              = var.cloud_sql_tier
    availability_type = "REGIONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    maintenance_window {
      day          = var.cloud_sql_maintenance_window_day
      hour         = var.cloud_sql_maintenance_window_hour
      update_track = var.cloud_sql_maintenance_window_update_track
    }

    ip_configuration {
      ipv4_enabled                                  = var.cloud_sql_enable_public_ip
      private_network                               = google_compute_network.gke.id
      enable_private_path_for_google_cloud_services = true
    }
  }

  lifecycle {
    # For imported existing instances, avoid unintentionally resetting advanced SQL settings.
    ignore_changes = [
      settings[0].backup_configuration[0].location,
      settings[0].database_flags,
      settings[0].deletion_protection_enabled,
      settings[0].final_backup_config,
      settings[0].password_validation_policy,
      settings[0].retain_backups_on_delete
    ]
  }

  depends_on = [
    google_project_service.required,
    google_service_networking_connection.private_vpc_connection
  ]
}

resource "google_sql_database" "app" {
  count    = var.create_cloud_sql && var.manage_cloud_sql_database_and_user ? 1 : 0
  name     = var.cloud_sql_database_name
  instance = google_sql_database_instance.postgres[0].name
}

resource "google_sql_user" "app" {
  count    = var.create_cloud_sql && var.manage_cloud_sql_database_and_user ? 1 : 0
  name     = var.cloud_sql_username
  instance = google_sql_database_instance.postgres[0].name
  password = random_password.cloud_sql_app_password[0].result
}
