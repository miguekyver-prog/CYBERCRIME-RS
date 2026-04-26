# Quick Start Guide - Your Website is Running! ✓

## Current Status
✅ **Frontend**: http://localhost:3000 (Running)  
✅ **Backend**: http://localhost:3001 (Running)  
✅ **Website**: Ready to use!

---

## Right Now - What to Do

### Step 1: Open Browser
Go to: **http://localhost:3000**

### Step 2: Login
Use your account credentials to login

### Step 3: Use Your Website
- Dashboard
- Submit Reports
- Manage Settings
- etc.

---

## IMPORTANT: Keep Terminals Open!

**DO NOT CLOSE THESE TERMINALS!**

You have 2 terminal windows running your servers:

```
Terminal 1: Frontend server (port 3000)
Terminal 2: Backend server (port 3001)
```

If you close either terminal, your website will stop working.

---

## Next Time You Want to Start Working

### Option A: Start Both at Once (from root)
```bash
cd c:\Users\migue\my-app
npm run dev
```
This starts both frontend and backend together.

### Option B: Start Separately (Recommended)

**Terminal 1 - Frontend:**
```bash
cd c:\Users\migue\my-app\frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd c:\Users\migue\my-app\backend
npm run dev
```

Then open: http://localhost:3000

---

## Understanding Your Architecture

```
┌─────────────────────────────────────────┐
│   Your Browser                          │
│   http://localhost:3000                 │
└──────────────┬──────────────────────────┘
               │
               │ Displays UI (React)
               │
        ┌──────▼──────────────────────┐
        │   Frontend Server (Port 3000)│
        │   Next.js / React App        │
        │   - Shows pages              │
        │   - Handles user input       │
        └──────┬──────────────────────┘
               │
               │ API Calls
               │ http://localhost:3001/api/*
               │
        ┌──────▼──────────────────────┐
        │ Backend Server (Port 3001)   │
        │ Next.js API Server           │
        │ - 15 API routes              │
        │ - Database queries           │
        │ - Email sending              │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ MySQL Database               │
        │ Users, Reports, Authorities  │
        └─────────────────────────────┘
```

---

## File Locations

### Frontend Files (Port 3000)
```
frontend/
├── app/
│   ├── page.js              (Login page)
│   ├── layout.js
│   ├── dashboard/           (Protected pages)
│   ├── report/
│   ├── settings/
│   ├── signup/
│   └── reset-password/
├── public/                  (Images, static files)
└── .env.local              (Config: API_URL, Google Client ID)
```

### Backend Files (Port 3001)
```
backend/
├── app/api/
│   ├── login/              (POST login)
│   ├── signup/             (POST signup)
│   ├── reports/            (GET/POST reports)
│   ├── report/[id]/        (GET/DELETE specific report)
│   ├── authority/          (Authority management)
│   ├── settings/           (User settings)
│   ├── forgot-password/    (Password reset)
│   ├── reset-password/     (Confirm reset)
│   ├── google-login/       (Google OAuth)
│   ├── test/               (Health check)
│   └── test-send-email/    (Email test)
├── lib/
│   ├── db.js              (MySQL connection)
│   ├── email.js           (Email service)
│   └── useAuth.js         (Auth utilities)
└── .env.local             (DB credentials, Email settings)
```

---

## Common Tasks

### Task: Restart Servers
1. Close both terminal windows (Ctrl+C or close the window)
2. Open new terminals
3. Run: `cd frontend && npm run dev` (Terminal 1)
4. Run: `cd backend && npm run dev` (Terminal 2)

### Task: Check If Servers are Running
```bash
# Test Frontend
curl http://localhost:3000

# Test Backend
curl http://localhost:3001/api/test
```

### Task: View Backend API
http://localhost:3001

### Task: Check Logs
- Frontend errors: Check Terminal 1
- Backend errors: Check Terminal 2
- Browser console: Press F12 in browser

---

## Troubleshooting

### Problem: "Port already in use"
**Solution**: Close other instances of the app
```bash
taskkill /F /IM node.exe
# Then start fresh
```

### Problem: "Cannot find module"
**Solution**: Reinstall dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Problem: "Database connection error"
**Solution**: 
1. Ensure MySQL is running
2. Check `backend/.env.local` has correct credentials
3. Verify database `crs` exists

### Problem: "Email not sending"
**Solution**:
1. Check `backend/.env.local` has email credentials
2. May need Gmail app password (not regular password)
3. Ensure firewall allows SMTP port 587

### Problem: "Cannot GET /api/xyz"
**Solution**: Check that backend is running on port 3001
```bash
curl http://localhost:3001/api/test
```

---

## Configuration Files

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=862494866742-0sb0mvdcjuidrvi9sq7k28lkb8mcap4a.apps.googleusercontent.com
```

### Backend `.env.local`
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crs
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=kyver.migue@bisu.edu.oh
EMAIL_PASS=kyver081122
AUTHORITY_EMAIL=kyver.migue@bisu.edu.oh
```

---

## API Endpoints Reference

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - Registration
- `POST /api/forgot-password` - Request reset
- `POST /api/reset-password` - Complete reset
- `POST /api/google-login` - Google OAuth

### Data Management
- `GET/POST /api/authority` - Authority management
- `GET/POST /api/reports` - Report list
- `GET /api/reports/:id` - Specific report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/report` - Submit new report

### Settings
- `GET/POST /api/settings` - User settings

### Utilities
- `GET /api/test` - Health check
- `POST /api/test-send-email` - Email test
- `POST /api/migrate` - Database migration

---

## Need Help?

Check:
1. Terminal output for error messages
2. Browser console (F12) for frontend errors
3. Backend `.env.local` for configuration
4. Make sure both servers are running
5. Verify MySQL database is running

---

**Your website is ready to use! 🎉**

Open: http://localhost:3000
