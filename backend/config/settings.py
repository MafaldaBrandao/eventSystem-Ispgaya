import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
if os.getenv('DJANGO_ENV', '').strip().lower() == 'test':
    load_dotenv(BASE_DIR / '.env.test', override=True)

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-only-secret-key')
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
    if host.strip()
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'infocultura',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'infocultura'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-pt'
TIME_ZONE = 'Europe/Lisbon'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'infocultura.core.authentication.InfoCulturaJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'infocultura-default',
    }
}

EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend',
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '25'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'False').lower() == 'true'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() == 'true'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'InfoCultura <noreply@ispgaya.pt>')

INFOCULTURA_JWT_SECRET = os.getenv('INFOCULTURA_JWT_SECRET', SECRET_KEY)
INFOCULTURA_JWT_EXPIRES_HOURS = int(os.getenv('INFOCULTURA_JWT_EXPIRES_HOURS', '12'))
INFOCULTURA_ACCESS_TOKEN_MINUTES = int(os.getenv('INFOCULTURA_ACCESS_TOKEN_MINUTES', '30'))
INFOCULTURA_REFRESH_TOKEN_DAYS = int(os.getenv('INFOCULTURA_REFRESH_TOKEN_DAYS', '7'))
INFOCULTURA_ACCESS_COOKIE_NAME = os.getenv('INFOCULTURA_ACCESS_COOKIE_NAME', 'infocultura_access')
INFOCULTURA_REFRESH_COOKIE_NAME = os.getenv('INFOCULTURA_REFRESH_COOKIE_NAME', 'infocultura_refresh')
INFOCULTURA_AUTH_COOKIE_SECURE = os.getenv('INFOCULTURA_AUTH_COOKIE_SECURE', 'False').lower() == 'true'
INFOCULTURA_AUTH_COOKIE_SAMESITE = os.getenv('INFOCULTURA_AUTH_COOKIE_SAMESITE', 'Lax')
INFOCULTURA_LOGIN_MAX_ATTEMPTS = int(os.getenv('INFOCULTURA_LOGIN_MAX_ATTEMPTS', '5'))
INFOCULTURA_LOGIN_WINDOW_SECONDS = int(os.getenv('INFOCULTURA_LOGIN_WINDOW_SECONDS', '900'))
INFOCULTURA_LOGIN_LOCKOUT_SECONDS = int(os.getenv('INFOCULTURA_LOGIN_LOCKOUT_SECONDS', '900'))
INFOCULTURA_ADMIN_USER = os.getenv('INFOCULTURA_ADMIN_USER', 'admin')
INFOCULTURA_ADMIN_EMAIL = os.getenv('INFOCULTURA_ADMIN_EMAIL', 'admin@ispgaya.pt')
INFOCULTURA_ADMIN_PASS = os.getenv('INFOCULTURA_ADMIN_PASS', 'cultura2026')

EVENTBRITE_API_BASE_URL = os.getenv('EVENTBRITE_API_BASE_URL', 'https://www.eventbriteapi.com/v3')
EVENTBRITE_API_KEY = os.getenv('EVENTBRITE_API_KEY', '')
EVENTBRITE_CLIENT_SECRET = os.getenv('EVENTBRITE_CLIENT_SECRET', '')
EVENTBRITE_PRIVATE_TOKEN = os.getenv('EVENTBRITE_PRIVATE_TOKEN', '')
EVENTBRITE_PUBLIC_TOKEN = os.getenv('EVENTBRITE_PUBLIC_TOKEN', '')
EVENTBRITE_ORGANIZATION_ID = os.getenv('EVENTBRITE_ORGANIZATION_ID', '')
EVENTBRITE_DEFAULT_CURRENCY = os.getenv('EVENTBRITE_DEFAULT_CURRENCY', 'EUR')
EVENTBRITE_DEFAULT_TIMEZONE = os.getenv('EVENTBRITE_DEFAULT_TIMEZONE', TIME_ZONE)
EVENTBRITE_DEFAULT_COUNTRY = os.getenv('EVENTBRITE_DEFAULT_COUNTRY', 'PT')
EVENTBRITE_DEFAULT_VENUE_ID = os.getenv('EVENTBRITE_DEFAULT_VENUE_ID', '')
EVENTBRITE_TICKET_NAME = os.getenv('EVENTBRITE_TICKET_NAME', 'Entrada geral')

SILENCED_SYSTEM_CHECKS = ['models.W036']

