import os
from .settings import *

# Production settings
DEBUG = False
ALLOWED_HOSTS = [
    'location-tracker-4zk7.onrender.com',
    'localhost',
    '127.0.0.1'
]

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://location-tracker-135y.vercel.app",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Database for production (can be overridden with DATABASE_URL)
if 'DATABASE_URL' in os.environ:
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

# Static files for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'