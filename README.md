# Citizen Report System

A full-stack web application for citizens to submit reports to authorities.

## Project Structure

```
my-app/
├── frontend/          # Next.js frontend (port 3000)
├── backend/           # Express.js backend (port 3001)
├── package.json       # Root scripts for development
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MySQL database with `crs` database created

## Quick Start

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

The configuration files are already set up:
- `backend/.env.local` - Backend configuration
- `frontend/.env.local` - Frontend configuration

Edit these files to match your environment (especially database credentials and email settings).

### 3. Start Development Servers

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 4. (Optional) Run Servers Separately

```bash
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only
```

## API Endpoints

### Health Check
- `GET /api/health` - Check backend status

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with token

### Reports
- `POST /api/report` - Submit a new report
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get specific report

### Authority
- `GET /api/authority` - Get all authorities
- `GET /api/authority/:id` - Get specific authority

### Settings
- `GET /api/settings` - Get application settings

## Backend Configuration (.env.local)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crs
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
AUTHORITY_EMAIL=authority@example.com
PORT=3001
```

## Frontend Configuration (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3000
```

## Technology Stack

### Frontend
- **Next.js 16** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **MySQL2** - Database client
- **Nodemailer** - Email service
- **Bcrypt.js** - Password hashing
- **CORS** - Cross-origin support

## Production Build

Build for production:
```bash
npm run build
```

Start production servers:
```bash
npm run start
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify MySQL is running
- Confirm database `crs` exists
- Check backend/.env.local has correct credentials

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Verify NEXT_PUBLIC_API_URL in frontend/.env.local
- Check browser console for CORS errors

### Emails not sending
- Verify email credentials in backend/.env.local
- Ensure SMTP service is accessible
- Check spam folder for test emails

## Development Notes

- The frontend makes API calls to `http://localhost:3001/api/*`
- All API responses include proper CORS headers
- Database credentials should match your local setup
- Email service requires valid SMTP credentials

## License

MIT
