#!/bin/bash

# CustomERP EC2 Deployment Script
echo "🚀 Starting CustomERP deployment on EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
print_status "Installing system dependencies..."
sudo apt install -y python3 python3-pip python3-venv nodejs npm git nginx

# Install Node.js 18+
print_status "Installing Node.js 18+..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup backend
print_status "Setting up Django backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    cp .env.ec2 .env
    print_warning "Please edit backend/.env file with your EC2 IP and configuration"
fi

# Create directories
mkdir -p staticfiles logs

# Run migrations
print_status "Running database migrations..."
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
print_status "Creating Django superuser..."
python manage.py createsuperuser

cd ..

# Setup frontend
print_status "Setting up React frontend..."
cd frontend

# Install Node dependencies
npm install

print_warning "Please update src/services/api.ts with your EC2 IP"

cd ..

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Create PM2 configurations
print_status "Creating PM2 configurations..."

# Backend PM2 config
cat > backend/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'custom-erp-backend',
      script: 'venv/bin/gunicorn',
      args: 'custom_erp.wsgi:application --bind 0.0.0.0:8000 --workers 3',
      cwd: '$(pwd)/backend',
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
EOL

# Frontend PM2 config
cat > frontend/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'custom-erp-frontend',
      script: 'npm',
      args: 'run start:ec2',
      cwd: '$(pwd)/frontend',
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
EOL

print_status "✅ Deployment setup complete!"
print_warning "Next steps:"
echo "1. Edit backend/.env with your EC2 IP address"
echo "2. Edit frontend/src/services/api.ts with your EC2 IP"
echo "3. Start services:"
echo "   cd backend && pm2 start ecosystem.config.js"
echo "   cd frontend && pm2 start ecosystem.config.js"
echo "4. Save PM2 config: pm2 save && pm2 startup"
echo ""
print_status "Access your app at: http://YOUR_EC2_IP:8080"
print_status "Access admin at: http://YOUR_EC2_IP:8000/admin/"