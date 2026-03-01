from pathlib import Path
import os
from functools import lru_cache
from corsheaders.defaults import default_headers
from datetime import timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Local convenience: auto-pick service-account JSON if present in project root.
if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    _local_sa_files = sorted(PROJECT_ROOT.glob("deadbots-*.json"))
    if _local_sa_files:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(_local_sa_files[0])


def _to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _to_csv_list(value, default=None):
    if value is None:
        return default or []
    items = [item.strip() for item in str(value).split(",")]
    items = [item for item in items if item]
    return items if items else (default or [])


USE_GCP_SECRET_MANAGER = True
GCP_PROJECT_ID = "deadbots"
SECRET_MANAGER_PREFIX = os.getenv("SECRET_MANAGER_PREFIX", "")


@lru_cache(maxsize=1)
def _get_secret_manager_client():
    # Lazy import keeps local dev working even without this package installed.
    try:
        from google.cloud import secretmanager
    except ImportError:
        return None
    try:
        return secretmanager.SecretManagerServiceClient()
    except Exception:
        return None


@lru_cache(maxsize=256)
def _read_secret(secret_name):
    if not USE_GCP_SECRET_MANAGER:
        return None
    if not secret_name:
        return None

    client = _get_secret_manager_client()
    if client is None:
        return None
    full_name = f"projects/{GCP_PROJECT_ID}/secrets/{secret_name}/versions/latest"
    try:
        response = client.access_secret_version(request={"name": full_name})
        return response.payload.data.decode("utf-8").strip()
    except Exception:
        return None


def get_secret_or_env(env_name, default=None, secret_name=None):
    env_value = os.getenv(env_name)
    if env_value not in (None, ""):
        return env_value

    resolved_secret_name = secret_name or f"{SECRET_MANAGER_PREFIX}{env_name}"
    secret_value = _read_secret(resolved_secret_name)
    if secret_value not in (None, ""):
        return secret_value

    return default


def get_secret_or_env_prod(base_name, default=None):
    # Preferred naming for production secrets: <NAME>_PROD
    # Fallback to legacy <NAME> for backward compatibility.
    prod_name = f"{base_name}_PROD"
    prod_value = get_secret_or_env(prod_name, None)
    if prod_value not in (None, ""):
        return prod_value
    return get_secret_or_env(base_name, default)


# GCP Cloud Storage (media files)
# Kept in code by request (only credentials JSON remains secret-managed/env-managed).
GCS_BUCKET_NAME = "hirelink-prod-files"
GCS_PROJECT_ID = "deadbots"
GCS_MEDIA_PREFIX = "media"
GCS_STATIC_PREFIX = "static"
GCS_CREDENTIALS_JSON = get_secret_or_env_prod("GCS_CREDENTIALS_JSON", "")
GCS_MAKE_PUBLIC = True


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = PROJECT_ROOT


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_secret_or_env_prod("DJANGO_SECRET_KEY", "django-insecure-change-me")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Update allowed hosts for production
_default_allowed_hosts = [
    "app.niranjan.cloud",
    "api.niranjan.cloud",
    "admin.niranjan.cloud",
    "localhost",
    "127.0.0.1",
]
ALLOWED_HOSTS = _to_csv_list(
    get_secret_or_env_prod("DJANGO_ALLOWED_HOSTS", ",".join(_default_allowed_hosts)),
    _default_allowed_hosts,
)

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'djoser',
    'accounts',
    'corsheaders',
    'django_extensions',
    'jobs',
    'core',
    'help',
    'settings',
    'payments',
    'subscriptions',
]


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),  # 24 hours
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # Optional: extend refresh token
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}


DJOSER = {
    'LOGIN_FIELD': 'email',
    'USER_CREATE_PASSWORD_RETYPE': True,
    'SERIALIZERS': {
        'user_create': 'accounts.serializers.UserCreateSerializer',
        'user': 'accounts.serializers.UserSerializer',
        'current_user': 'accounts.serializers.UserSerializer',
    },
    'PERMISSIONS': {
        'user_create': ['rest_framework.permissions.AllowAny'],
    },
    'HIDE_USERS': False,
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

_default_cors_allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://app.niranjan.cloud",
]
CORS_ALLOWED_ORIGINS = _to_csv_list(
    get_secret_or_env_prod("CORS_ALLOWED_ORIGINS", ",".join(_default_cors_allowed_origins)),
    _default_cors_allowed_origins,
)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://localhost(:\d+)?$",
    r"^https?://127\.0\.0\.1(:\d+)?$",
]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

_default_csrf_trusted_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://app.niranjan.cloud",
    "https://api.niranjan.cloud",
    "https://admin.niranjan.cloud",
]
CSRF_TRUSTED_ORIGINS = _to_csv_list(
    get_secret_or_env_prod("CSRF_TRUSTED_ORIGINS", ",".join(_default_csrf_trusted_origins)),
    _default_csrf_trusted_origins,
)

ROOT_URLCONF = 'hirelink_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hirelink_api.wsgi.application'

# able to hear?
# turn on audio
#ok

# Database (GCP Cloud SQL PostgreSQL)
# Keep DB and app secrets in Secret Manager for production.
CLOUD_SQL_CONNECTION_NAME = get_secret_or_env_prod(
    "CLOUD_SQL_CONNECTION_NAME",
    "deadbots:us-central1:hirelink-production-db",
)
USE_CLOUD_SQL_PROXY = _to_bool(get_secret_or_env_prod("USE_CLOUD_SQL_PROXY", "false"), default=False)
DEFAULT_DB_HOST = "127.0.0.1" if USE_CLOUD_SQL_PROXY else "10.114.0.4"
# App tables should live in a dedicated schema, not public.
DB_SCHEMA = "hirelink_app"
DB_NAME = "hirelink-production-db"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": DB_NAME,
        "USER": get_secret_or_env_prod("DB_USER", "hirelink-prod-app-user"),
        "PASSWORD": get_secret_or_env_prod("DB_PASSWORD", ""),
        "HOST": get_secret_or_env_prod("DB_HOST", DEFAULT_DB_HOST),
        "PORT": get_secret_or_env_prod("DB_PORT", "5432"),
        "OPTIONS": {
            "sslmode": get_secret_or_env_prod("DB_SSLMODE", "require"),
            "connect_timeout": 10,
            "keepalives_idle": 30,
            "options": f"-c search_path={DB_SCHEMA}",
        },
        "CONN_MAX_AGE": 60,
    }
}


# # Temporarily replace DATABASES in settings.py with:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': ':memory:',
#     }
# }

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ✅ Email Configuration (Zoho Mail)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.zoho.in"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = "contact@vamsikrishna.site"
EMAIL_HOST_PASSWORD = get_secret_or_env_prod("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


#Social logins
GOOGLE_CLIENT_ID = get_secret_or_env_prod("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = get_secret_or_env_prod("GOOGLE_CLIENT_SECRET", "")



#payments
#test key
RAZORPAY_KEY_ID = get_secret_or_env_prod("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = get_secret_or_env_prod("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = get_secret_or_env_prod("RAZORPAY_WEBHOOK_SECRET", "")



