# Deployment Guide

This guide covers deploying the CustomERP system to production using Vercel for both frontend and backend.

## Architecture Overview

- **Frontend**: React app deployed on Vercel
- **Backend**: Django API deployed on Vercel (serverless functions)
- **Database**: Vercel Postgres (or external PostgreSQL)

## 1. Backend Deployment (Vercel - Serverless)
```python
import os
from django.core.management.utils import get_random_secret_key

# Production settings
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
SECRET_KEY = os.getenv('SECRET_KEY', get_random_secret_key())

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app',  # For Railway
    '.herokuapp.com',  # For Heroku
    '.render.com',  # For Render
    # Add your custom domain here
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'custom_erp'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True
```

### Step 2: Create Railway Account and Deploy

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `CustomERP` repository
4. Choose the `backend` directory as root
5. Railway will auto-detect Django and deploy

### Step 3: Add Environment Variables in Railway

Add these environment variables in Railway dashboard:

```
DEBUG=False
SECRET_KEY=your-super-secret-key-here
DB_NAME=railway
DB_USER=postgres  
DB_PASSWORD=auto-generated-by-railway
DB_HOST=auto-generated-by-railway
DB_PORT=5432
```

### Step 4: Run Database Migrations

In Railway terminal or locally with production database:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

## 2. Frontend Deployment (Vercel)

### Step 1: Update API URL

Update `frontend/.env.production`:
```
REACT_APP_API_BASE_URL=https://your-backend-domain.railway.app/api
REACT_APP_APP_NAME=Custom ERP
REACT_APP_VERSION=1.0.0
```

### Step 2: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Set these build settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Add Environment Variables in Vercel

Add these in Vercel dashboard → Project → Settings → Environment Variables:

```
REACT_APP_API_BASE_URL=https://your-backend-domain.railway.app/api
REACT_APP_APP_NAME=Custom ERP
REACT_APP_VERSION=1.0.0
```

### Step 4: Update Backend CORS

Update your backend CORS settings with your Vercel domain:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.vercel.app",
]
```

## 3. Database Setup

### Option A: Railway PostgreSQL (Recommended)
1. In Railway, add a PostgreSQL service to your project
2. Railway will provide connection details automatically
3. Update your environment variables with the provided credentials

### Option B: External Database (AWS RDS, DigitalOcean, etc.)
1. Create a PostgreSQL instance
2. Update environment variables with connection details
3. Ensure the database allows connections from your backend host

## 4. Domain Configuration (Optional)

### Custom Domain for Frontend (Vercel)
1. In Vercel dashboard → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Custom Domain for Backend (Railway)
1. In Railway dashboard → Settings → Networking
2. Add custom domain
3. Update DNS records

## 5. SSL Certificate

Both Vercel and Railway provide automatic SSL certificates for HTTPS.

## 6. Environment Variables Summary

### Backend (.env)
```
DEBUG=False
SECRET_KEY=your-secret-key
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
ALLOWED_HOSTS=.railway.app,.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```
REACT_APP_API_BASE_URL=https://your-backend.railway.app/api
REACT_APP_APP_NAME=Custom ERP
REACT_APP_VERSION=1.0.0
```

## 7. Monitoring and Logs

### Railway
- Check logs in Railway dashboard
- Set up log drains if needed

### Vercel
- Check function logs in Vercel dashboard
- Monitor build logs and runtime logs

## 8. Security Checklist

- [ ] DEBUG is set to False in production
- [ ] SECRET_KEY is secure and not hardcoded
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] HTTPS is enabled
- [ ] Environment variables are set correctly
- [ ] Database backups are configured

## 9. Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure frontend domain is in CORS_ALLOWED_ORIGINS
2. **Database Connection**: Check database credentials and host accessibility
3. **Static Files**: Run `collectstatic` command on backend
4. **Environment Variables**: Verify all required variables are set

### Health Checks:

- Backend API: `https://your-backend.railway.app/api/`
- Frontend: `https://your-frontend.vercel.app`
- Database: Check connection in backend logs

## 10. Post-Deployment Steps

1. Test all functionality in production
2. Create initial data (categories, products, etc.)
3. Set up monitoring and alerts
4. Configure automated backups
5. Document any production-specific procedures

## Support

For deployment issues, check:
1. Railway documentation: https://docs.railway.app
2. Vercel documentation: https://vercel.com/docs
3. Django deployment guides: https://docs.djangoproject.com/en/stable/howto/deployment/