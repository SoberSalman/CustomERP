# CustomERP - EC2 Deployment Guide

Complete production-ready ERP system with React frontend and Django backend, optimized for EC2 deployment.

## 🚀 Quick Start for EC2

### Prerequisites
- EC2 instance with Ubuntu 22.04 LTS
- Security Group allowing inbound traffic on ports 80, 8080, 8000
- SSH access to EC2 instance

### 1. Connect to Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 2. Update System and Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm git nginx
```

### 3. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. Clone the Repository
```bash
git clone https://github.com/SoberSalman/CustomERP.git
cd CustomERP
```

## 🔧 Backend Setup (Django API)

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Environment Variables
```bash
cp .env.ec2 .env
nano .env
```

**Update these values in .env:**
```bash
SECRET_KEY=your-super-secret-key-here-change-this-in-production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,YOUR_EC2_PUBLIC_IP
DATABASE_URL=sqlite:///./db.sqlite3
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_PUBLIC_IP:8080,http://localhost:8080
DJANGO_SETTINGS_MODULE=custom_erp.settings_ec2
```

### 5. Run Database Migrations
```bash
python manage.py migrate
```

### 6. Create Superuser
```bash
python manage.py createsuperuser
```

### 7. Create Static Files Directory and Logs
```bash
mkdir -p staticfiles logs
python manage.py collectstatic --noinput
```

### 8. Test Backend
```bash
python manage.py runserver 0.0.0.0:8000
```

Open browser: `http://YOUR_EC2_PUBLIC_IP:8000/admin/` - You should see Django admin.

## 🎨 Frontend Setup (React App)

### 1. Open New Terminal and Navigate to Frontend
```bash
cd CustomERP/frontend
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Update API Base URL
```bash
nano src/services/api.ts
```

Update the baseURL to your EC2 backend:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://YOUR_EC2_PUBLIC_IP:8000/api';
```

### 4. Test Frontend
```bash
npm run start:ec2
```

Open browser: `http://YOUR_EC2_PUBLIC_IP:8080` - You should see the login page.

## 🔐 Production Deployment with PM2

### 1. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2. Create Backend PM2 Configuration
```bash
nano ~/CustomERP/backend/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'custom-erp-backend',
      script: 'venv/bin/gunicorn',
      args: 'custom_erp.wsgi:application --bind 0.0.0.0:8000 --workers 3',
      cwd: '/home/ubuntu/CustomERP/backend',
      env: {
        DJANGO_SETTINGS_MODULE: 'custom_erp.settings_ec2'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### 3. Create Frontend PM2 Configuration
```bash
nano ~/CustomERP/frontend/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'custom-erp-frontend',
      script: 'npm',
      args: 'run start:ec2',
      cwd: '/home/ubuntu/CustomERP/frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOST: '0.0.0.0'
      }
    }
  ]
};
```

### 4. Start Services with PM2
```bash
# Start backend
cd ~/CustomERP/backend
pm2 start ecosystem.config.js

# Start frontend  
cd ~/CustomERP/frontend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🌐 Nginx Configuration (Optional)

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/custom-erp
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP_OR_DOMAIN;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /home/ubuntu/CustomERP/backend/staticfiles/;
    }
}
```

### 2. Enable Site and Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/custom-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📋 System Status and Management

### Check PM2 Status
```bash
pm2 status
pm2 logs custom-erp-backend
pm2 logs custom-erp-frontend
```

### Restart Services
```bash
pm2 restart custom-erp-backend
pm2 restart custom-erp-frontend
```

### Update Application
```bash
cd ~/CustomERP
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
pm2 restart custom-erp-backend

# Update frontend
cd ../frontend  
npm install
pm2 restart custom-erp-frontend
```

## 🔍 Access Points

After successful deployment:

- **Frontend (Main App):** `http://YOUR_EC2_PUBLIC_IP:8080`
- **Backend Admin:** `http://YOUR_EC2_PUBLIC_IP:8000/admin/`
- **API Root:** `http://YOUR_EC2_PUBLIC_IP:8000/api/`

With Nginx (port 80):
- **Frontend:** `http://YOUR_EC2_PUBLIC_IP`
- **Admin:** `http://YOUR_EC2_PUBLIC_IP/admin/`
- **API:** `http://YOUR_EC2_PUBLIC_IP/api/`

## 📊 Phase 2 Features Included

✅ **Inventory Management**
- Products, categories, suppliers
- Stock tracking and adjustments
- Low stock alerts

✅ **Sales Management**
- Sales orders with workflow
- Professional invoicing
- Payment tracking
- PDF invoice generation

✅ **Customer Management**
- Customer profiles and contacts
- Customer categories and status
- Interaction history

✅ **Reports & Analytics**
- Real-time dashboard with charts
- Sales performance metrics
- Inventory reports
- Customer insights
- Financial summaries

✅ **Multi-Tenant Architecture**
- Organization-based data isolation
- Role-based access control
- Tenant middleware

## 🛠️ Troubleshooting

### Backend Issues
```bash
# Check Django logs
tail -f ~/CustomERP/backend/logs/django.log

# Check PM2 logs
pm2 logs custom-erp-backend

# Test backend directly
cd ~/CustomERP/backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend Issues
```bash
# Check PM2 logs
pm2 logs custom-erp-frontend

# Test frontend directly
cd ~/CustomERP/frontend
npm run start:ec2
```

### Database Issues
```bash
cd ~/CustomERP/backend
source venv/bin/activate
python manage.py shell
# Test database connection
```

## 🔒 Security Considerations

1. **Change default SECRET_KEY** in production
2. **Set DEBUG=False** for production
3. **Configure proper ALLOWED_HOSTS**
4. **Use PostgreSQL** for production database
5. **Set up SSL/HTTPS** with Let's Encrypt
6. **Configure firewall** properly
7. **Regular security updates**

## 📈 Performance Optimization

1. **Use PostgreSQL** instead of SQLite for production
2. **Configure Redis** for caching
3. **Use CDN** for static files
4. **Enable Gzip** compression in Nginx
5. **Set up database connection pooling**
6. **Monitor with tools** like New Relic or DataDog

## 💾 Backup Strategy

```bash
# Database backup
cd ~/CustomERP/backend
source venv/bin/activate
python manage.py dumpdata > backup_$(date +%Y%m%d_%H%M%S).json

# Full application backup
tar -czf custom_erp_backup_$(date +%Y%m%d_%H%M%S).tar.gz ~/CustomERP
```

## 🆘 Support

For issues or questions:
1. Check the logs first (PM2 and Django logs)
2. Verify all environment variables are set correctly
3. Ensure all services are running (`pm2 status`)
4. Check EC2 security group settings
5. Verify port accessibility

Your CustomERP system is now ready for production on EC2! 🎉