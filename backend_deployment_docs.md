# Backend Deployment Process

## Initial Setup

1. Created a Dockerfile in the backend directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy the backend directory to /app/backend
COPY . /app/backend/

# Install dependencies
RUN pip install -r /app/backend/requirements.txt

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory to /app
WORKDIR /app

# Create a script to run migrations and start the server
RUN echo '#!/bin/bash\npython -m backend.manage migrate\ndaphne -b 0.0.0.0 -p 8000 backend.backend.asgi:application' > /app/start.sh
RUN chmod +x /app/start.sh

# Command to run migrations and start the server
CMD ["/app/start.sh"]
```

## Railway Setup

1. Created a new project on [Railway.app](https://railway.app)
2. Connected the GitHub repository
3. Added the following services:
   - Django backend (from Dockerfile)
   - PostgreSQL database (created as a different service within the same project in Railway in a single click)
   - Redis instance (created as a different service within the same project in Railway in a single click)

## Environment Variables

Set up the following environment variables in Railway:

```env
SECRET_KEY=my_django_secret_key

DEBUG=False

ALLOWED_HOSTS=*

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://deal-frontend-psi.vercel.app

DATABASE_URL=postgresql://... (automatically added by Railway)

REDIS_URL=redis://... (automatically added by Railway)
```

## Database Configuration

Updated `settings.py` to use PostgreSQL in production:

```python
# Database configuration
if os.getenv('DATABASE_URL'):
    # Use PostgreSQL in production
    DATABASES = {
        'default': dj_database_url.config(
            default=os.getenv('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Use SQLite locally
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

## Dependencies

Added required packages to `requirements.txt`:

```txt
Django>=4.2.0
channels>=4.0.0
channels-redis>=4.1.0
django-cors-headers>=4.2.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.2.2
uvicorn>=0.22.0
gunicorn>=21.2.0
python-dotenv>=1.0.0
daphne>=4.0.0
whitenoise>=6.5.0
psycopg2-binary>=2.9.6
colorama>=0.4.6
twisted[tls,http2]>=22.10.0
dj-database-url>=2.1.0
```

## CORS Configuration

Updated CORS settings in `settings.py` to allow frontend access:

```python
# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
```

## Deployment Process

1. Push code to GitHub repository
2. Railway automatically:
   - Detects the Dockerfile
   - Builds the container
   - Runs migrations
   - Starts the daphne server

## Post-Deployment

1. Verified database migrations were successful
2. Confirmed WebSocket connections working
3. Tested API endpoints
4. Verified CORS settings allowing frontend access
5. Checked Redis connection for real-time game state management

## Troubleshooting Steps Taken

1. Fixed database connection issues by properly configuring DATABASE_URL
2. Resolved CORS issues by adding Vercel domain to allowed origins
3. Fixed WebSocket connection by ensuring proper ASGI configuration
4. Resolved migration issues by updating the start script in Dockerfile

## Final Result

Backend successfully deployed at `https://deal-backend.up.railway.app` with:

- PostgreSQL for user data and game persistence
- Redis for WebSocket/Channels real-time communication
- Automatic deployments on git push
- Working CORS configuration for frontend access
