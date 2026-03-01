# GCP Secret Manager Setup (Production)

This backend now supports loading secrets from Google Secret Manager.

## 1. Required runtime env vars

Set these on your production runtime (GKE/Cloud Run/VM):

- `USE_GCP_SECRET_MANAGER=true`
- `GCP_PROJECT_ID=deadbots`
- `CLOUD_SQL_CONNECTION_NAME_PROD=deadbots:us-central1:hirelink-production-db`
- `USE_CLOUD_SQL_PROXY_PROD=false` (set `true` only when using Cloud SQL Auth Proxy)

Optional:

- `SECRET_MANAGER_PREFIX=` (empty by default)

## 2. Secret names expected (PROD naming)

The app now prefers `<NAME>_PROD` and falls back to legacy `<NAME>`.

- `DJANGO_SECRET_KEY_PROD`
- `CLOUD_SQL_CONNECTION_NAME_PROD`
- `USE_CLOUD_SQL_PROXY_PROD`
- `DB_NAME_PROD`
- `DB_USER_PROD`
- `DB_PASSWORD_PROD`
- `DB_HOST_PROD`
- `DB_PORT_PROD`
- `DB_SSLMODE_PROD`
- `GCS_BUCKET_NAME_PROD`
- `GCS_PROJECT_ID_PROD`
- `GCS_MEDIA_PREFIX_PROD`
- `GCS_STATIC_PREFIX_PROD`
- `GCS_CREDENTIALS_JSON_PROD` (service account JSON, optional if using Workload Identity)
- `GCS_MAKE_PUBLIC_PROD`
- `EMAIL_HOST_USER_PROD`
- `EMAIL_HOST_PASSWORD_PROD`
- `GOOGLE_CLIENT_ID_PROD`
- `GOOGLE_CLIENT_SECRET_PROD`
- `RAZORPAY_KEY_ID_PROD`
- `RAZORPAY_KEY_SECRET_PROD`
- `RAZORPAY_WEBHOOK_SECRET_PROD`

If `SECRET_MANAGER_PREFIX` is set (for example `HIRELINK_`), then secret names must be prefixed (for example `HIRELINK_DB_PASSWORD_PROD`).

## 3. Create secrets (example)

```powershell
gcloud config set project deadbots

echo -n "your-db-password" | gcloud secrets create DB_PASSWORD_PROD --data-file=-
echo -n "postgres" | gcloud secrets create DB_NAME_PROD --data-file=-
echo -n "postgres" | gcloud secrets create DB_USER_PROD --data-file=-
echo -n "104.197.11.5" | gcloud secrets create DB_HOST_PROD --data-file=-
echo -n "5432" | gcloud secrets create DB_PORT_PROD --data-file=-
echo -n "require" | gcloud secrets create DB_SSLMODE_PROD --data-file=-
echo -n "your-bucket" | gcloud secrets create GCS_BUCKET_NAME_PROD --data-file=-
echo -n "deadbots" | gcloud secrets create GCS_PROJECT_ID_PROD --data-file=-
echo -n "media" | gcloud secrets create GCS_MEDIA_PREFIX_PROD --data-file=-
echo -n "static" | gcloud secrets create GCS_STATIC_PREFIX_PROD --data-file=-
``` 

To update an existing secret:

```powershell
echo -n "new-value" | gcloud secrets versions add DB_PASSWORD_PROD --data-file=-
```

## 4. Service account permissions

Grant your runtime service account:

- `roles/secretmanager.secretAccessor`

Recommended:

- Use Workload Identity on GKE (no JSON key file).
- Do not store service-account JSON in source code.
