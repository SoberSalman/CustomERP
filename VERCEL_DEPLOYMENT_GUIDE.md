# Vercel Deployment Guide

Deploy both frontend and backend to Vercel using serverless functions.

## Prerequisites

1. GitHub repository: `https://github.com/SoberSalman/CustomERP`
2. Vercel account: [vercel.com](https://vercel.com)
3. Database: Vercel Postgres or external PostgreSQL

## Option 1: Deploy as Monorepo (Recommended)

Deploy both frontend and backend from the same repository.

### Step 1: Deploy Backend First

1. **Go to Vercel Dashboard**
   - Sign in to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import `SoberSalman/CustomERP`

2. **Configure Backend Deployment**
   - **Project Name**: `custom-erp-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: Leave empty

3. **Add Environment Variables**
   ```
   DJANGO_SETTINGS_MODULE=custom_erp.settings_production
   SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
   DEBUG=False
   ```

4. **Deploy Backend**
   - Click "Deploy"
   - Note your backend URL: `https://custom-erp-backend.vercel.app`

### Step 2: Add Database

**Option A: Vercel Postgres (Recommended)**
1. In your backend project dashboard
2. Go to "Storage" tab
3. Click "Create Database" → "Postgres"
4. Vercel will automatically add `DATABASE_URL` environment variable

**Option B: External Database**
1. Create PostgreSQL database (AWS RDS, DigitalOcean, etc.)
2. Add environment variable:
   ```
   DATABASE_URL=postgresql://user:password@host:port/dbname
   ```

### Step 3: Deploy Frontend

1. **Create New Project**
   - Click "New Project" again
   - Import the same repository `SoberSalman/CustomERP`

2. **Configure Frontend Deployment**
   - **Project Name**: `custom-erp-frontend`
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Add Environment Variables**
   ```
   REACT_APP_API_BASE_URL=https://custom-erp-backend.vercel.app
   REACT_APP_APP_NAME=Custom ERP
   REACT_APP_VERSION=1.0.0
   ```

4. **Deploy Frontend**
   - Click "Deploy"
   - Your frontend will be available at: `https://custom-erp-frontend.vercel.app`

### Step 4: Update CORS Settings

1. Go to your backend project
2. Add environment variable:
   ```
   CORS_ALLOWED_ORIGINS=https://custom-erp-frontend.vercel.app
   ```
3. Redeploy backend

## Option 2: Deploy as Separate Repositories

If you prefer separate repos for frontend and backend:

### Step 1: Create Separate Repositories

1. **Backend Repository**
   ```bash
   # Create new repo for backend only
   git subtree push --prefix=backend origin backend-only
   ```

2. **Frontend Repository** 
   ```bash
   # Create new repo for frontend only
   git subtree push --prefix=frontend origin frontend-only
   ```

### Step 2: Deploy Each Repository

Follow the same steps as above, but without specifying root directories.

## Configuration Files

The repository includes these Vercel configuration files:

### Backend (`backend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "custom_erp/wsgi.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "custom_erp/wsgi.py"
    }
  ]
}
```

### Frontend (`frontend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Environment Variables Summary

### Backend Environment Variables
```
DJANGO_SETTINGS_MODULE=custom_erp.settings_production
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend Environment Variables
```
REACT_APP_API_BASE_URL=https://your-backend.vercel.app
REACT_APP_APP_NAME=Custom ERP
REACT_APP_VERSION=1.0.0
```

## Database Migrations

After backend deployment, run migrations:

1. **Using Vercel CLI** (Recommended)
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   cd backend
   vercel link
   
   # Run migrations
   vercel exec -- python manage.py migrate
   vercel exec -- python manage.py createsuperuser
   ```

2. **Using Vercel Functions Dashboard**
   - Go to your backend project
   - Navigate to "Functions" tab
   - Find a function and click "View Source"
   - Use the terminal to run Django commands

## Post-Deployment Checklist

- [ ] Backend API responding: `https://your-backend.vercel.app/api/`
- [ ] Frontend loading: `https://your-frontend.vercel.app`
- [ ] Database connected and migrations run
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Admin panel accessible: `https://your-backend.vercel.app/admin/`
- [ ] API endpoints working
- [ ] Frontend can communicate with backend

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is in `CORS_ALLOWED_ORIGINS`
   - Check environment variables are set correctly

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Ensure database allows connections from Vercel

3. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are listed in requirements.txt/package.json

4. **Function Timeout**
   - Django serverless functions have 10-second timeout
   - Optimize database queries and API responses

### Logs and Monitoring

- **Backend Logs**: Vercel Dashboard → Your Backend Project → Functions
- **Frontend Logs**: Vercel Dashboard → Your Frontend Project → Functions
- **Build Logs**: Available during deployment process

## Scaling Considerations

### Serverless Limitations
- 10-second function timeout
- Cold starts may cause delays
- Limited concurrent executions

### Database
- Use connection pooling for PostgreSQL
- Consider read replicas for heavy read workloads
- Monitor database performance

## Security

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` 
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS properly configured
- [ ] Environment variables secure
- [ ] Database credentials protected

## Custom Domains (Optional)

### Frontend Domain
1. In Vercel Dashboard → Your Frontend Project
2. Go to "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Backend Domain
1. In Vercel Dashboard → Your Backend Project
2. Go to "Settings" → "Domains" 
3. Add your API subdomain (e.g., `api.yourdomain.com`)
4. Update frontend `REACT_APP_API_BASE_URL`

## Monitoring and Analytics

Vercel provides built-in analytics:
- Function performance metrics
- Error tracking
- Usage statistics

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Django on Vercel Guide](https://vercel.com/guides/deploying-django-with-vercel)
- [Next.js + Django Tutorial](https://vercel.com/templates/python/django-hello-world)

Your CustomERP system is now fully deployed on Vercel! 🚀