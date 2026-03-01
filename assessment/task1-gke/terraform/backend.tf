terraform {
  backend "gcs" {
    bucket = "deadbots-tfstate-prod-hirelink"
    prefix = "hirelink/task1-gke/prod"
  }
}
