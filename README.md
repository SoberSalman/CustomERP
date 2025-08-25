# CustomERP

A modern, multi-tenant Enterprise Resource Planning (ERP) system built with React and Django.

## Features

### Core Modules
- **Inventory Management**: Products, categories, suppliers, and stock tracking
- **Sales Management**: Sales orders, invoicing, and payment processing
- **Customer Management**: Customer profiles, contacts, and interactions
- **Reports & Analytics**: Real-time business insights and performance metrics

### Technical Features
- Multi-tenant architecture with organization-based data isolation
- Professional PDF generation for invoices and reports
- Interactive charts and dashboards
- Responsive design with Material-UI
- Role-based access control
- RESTful API with Django REST Framework

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI (MUI)** for UI components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Django 5.0+** with Python
- **Django REST Framework** for API
- **PostgreSQL** database
- **WeasyPrint** for PDF generation
- **Django-tenant-schemas** for multi-tenancy

## Project Structure

```
CustomERP/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── contexts/      # React contexts
│   └── public/
├── backend/           # Django application
│   ├── config/           # Django project settings
│   ├── apps/            # Django applications
│   │   ├── inventory/   # Inventory management
│   │   ├── sales/       # Sales management
│   │   ├── customers/   # Customer management
│   │   └── tenants/     # Multi-tenant functionality
│   └── templates/       # HTML templates for PDFs
└── requirements/      # Python dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 13+

### Backend Setup
1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API endpoint
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables in Vercel dashboard

### Backend Deployment
The backend can be deployed on platforms like:
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2
- Heroku

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth/` - Authentication
- `/api/inventory/` - Inventory management
- `/api/sales/` - Sales operations
- `/api/customers/` - Customer management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support or questions, please contact the development team.