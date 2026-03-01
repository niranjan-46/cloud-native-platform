import json
import mimetypes
import os
import uuid
from urllib.parse import quote

from django.conf import settings


def _get_storage_client():
    from google.cloud import storage
    from google.oauth2 import service_account

    credentials_json = getattr(settings, "GCS_CREDENTIALS_JSON", "")
    project_id = getattr(settings, "GCS_PROJECT_ID", "") or None

    if credentials_json:
        info = json.loads(credentials_json)
        creds = service_account.Credentials.from_service_account_info(info)
        return storage.Client(project=project_id or info.get("project_id"), credentials=creds)

    return storage.Client(project=project_id)


def _build_blob_name(folder, filename):
    folder = (folder or "").strip("/")
    if folder:
        return f"{folder}/{filename}"
    return filename


def _public_url(bucket_name, blob_name):
    return f"https://storage.googleapis.com/{bucket_name}/{quote(blob_name, safe='/')}"


def _validate_extension(file_name, allowed_formats=None):
    if not allowed_formats:
        return
    ext = os.path.splitext(file_name)[1].lstrip(".").lower()
    allowed = {fmt.lower() for fmt in allowed_formats}
    if ext and ext not in allowed:
        raise ValueError(f"Unsupported file extension '{ext}'. Allowed: {sorted(allowed)}")


def upload_file_to_gcs(file_obj, folder="", allowed_formats=None, filename=None):
    """
    Upload a Django UploadedFile to GCS and return a Cloudinary-like response dict.
    """
    if not getattr(settings, "GCS_BUCKET_NAME", ""):
        raise ValueError("GCS_BUCKET_NAME is not configured")

    original_name = getattr(file_obj, "name", "upload.bin")
    _validate_extension(original_name, allowed_formats=allowed_formats)

    ext = os.path.splitext(original_name)[1].lower()
    generated_name = filename or f"{uuid.uuid4().hex}{ext}"
    media_prefix = getattr(settings, "GCS_MEDIA_PREFIX", "media").strip("/")
    target_folder = "/".join(part for part in [media_prefix, folder.strip("/")] if part)
    blob_name = _build_blob_name(target_folder, generated_name)

    content_type = getattr(file_obj, "content_type", None) or mimetypes.guess_type(original_name)[0] or "application/octet-stream"

    client = _get_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(blob_name)
    blob.upload_from_file(file_obj, rewind=True, content_type=content_type)

    if getattr(settings, "GCS_MAKE_PUBLIC", True):
        try:
            blob.make_public()
            secure_url = blob.public_url
        except Exception:
            secure_url = _public_url(settings.GCS_BUCKET_NAME, blob_name)
    else:
        secure_url = _public_url(settings.GCS_BUCKET_NAME, blob_name)

    return {
        "secure_url": secure_url,
        "public_id": blob_name,
        "format": ext.lstrip("."),
    }


def upload_path_to_gcs(local_path, folder="", filename=None, content_type=None):
    """
    Upload a local file path to GCS and return a Cloudinary-like response dict.
    """
    if not getattr(settings, "GCS_BUCKET_NAME", ""):
        raise ValueError("GCS_BUCKET_NAME is not configured")

    base_name = filename or os.path.basename(local_path)
    ext = os.path.splitext(base_name)[1].lower()
    media_prefix = getattr(settings, "GCS_MEDIA_PREFIX", "media").strip("/")
    target_folder = "/".join(part for part in [media_prefix, folder.strip("/")] if part)
    blob_name = _build_blob_name(target_folder, base_name)

    client = _get_storage_client()
    bucket = client.bucket(settings.GCS_BUCKET_NAME)
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(local_path, content_type=content_type or mimetypes.guess_type(base_name)[0])

    if getattr(settings, "GCS_MAKE_PUBLIC", True):
        try:
            blob.make_public()
            secure_url = blob.public_url
        except Exception:
            secure_url = _public_url(settings.GCS_BUCKET_NAME, blob_name)
    else:
        secure_url = _public_url(settings.GCS_BUCKET_NAME, blob_name)

    return {
        "secure_url": secure_url,
        "public_id": blob_name,
        "format": ext.lstrip("."),
    }
