# Hirelink Frontend (Next.js)

Frontend domain:

- `https://app.niranjan.cloud`

Backend API base URL (public):

- `https://api.niranjan.cloud`

## Environment

Production env file:

- `.env.production`

Required keys:

```bash
NEXT_PUBLIC_API_URL=https://api.niranjan.cloud
NEXT_PUBLIC_RAZORPAY_KEY_ID=<public_key>
```

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

## Docker Build and Push (GCP Artifact Registry)

```powershell
$PROJECT_ID="deadbots"
$REGION="us-central1"
$REPO="hirelink"
$IMAGE_TAG="v1.1.1"

gcloud auth configure-docker "$REGION-docker.pkg.dev"

docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/hirelink-web:$IMAGE_TAG" .
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/hirelink-web:$IMAGE_TAG"
```

## Runtime Flow

1. User opens `app.niranjan.cloud`.
2. GKE HTTP(S) Load Balancer routes host traffic to `hirelink-web` service.
3. Frontend calls `NEXT_PUBLIC_API_URL` (`api.niranjan.cloud`).
4. Ingress routes API host traffic to `hirelink-api` service.
