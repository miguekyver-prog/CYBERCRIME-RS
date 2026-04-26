# All Available Commands

## Quick Reference

```bash
# 🚀 MOST COMMON COMMANDS
npm run dev              # Start both frontend and backend
npm run clean            # Kill any existing Node processes
npm run setup            # First-time setup (install + create .env)

# 🔍 DEBUGGING
npm run debug            # Check application health
npm run clean            # Clean up port conflicts

# 📦 INSTALLATION
npm run install:all      # Install dependencies for root, frontend, and backend
npm run create:env       # Create .env.local files from examples

# 🏗️ BUILDING
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# ▶️ RUNNING
npm run dev              # Dev mode (both servers with watch)
npm run start            # Production mode (both servers)
npm run dev:frontend     # Frontend only (port 3000)
npm run dev:backend      # Backend only (port 3001)
npm run start:frontend   # Frontend production
npm run start:backend    # Backend production

# 📋 CODE QUALITY
npm run lint             # Lint both frontend and backend
```

---

## Detailed Command Descriptions

### Development Commands

#### `npm run dev`
Starts both frontend and backend in development mode with hot reload.
- Frontend watches for changes and recompiles
- Backend watches for changes and restarts
- Runs frontend on http://localhost:3000
- Runs backend on http://localhost:3001
- **Automatically cleans up old Node processes first**

#### `npm run dev:frontend`
Starts only the frontend server on port 3000.
- Use this when backend is already running in another terminal

#### `npm run dev:backend`
Starts only the backend server on port 3001.
- Use this when frontend is already running in another terminal

### Production Commands

#### `npm run build`
Builds both frontend and backend for production.
- Creates optimized production bundles
- Runs `npm run build` in both directories
- Must complete successfully before `npm run start`

#### `npm run build:frontend`
Builds only the frontend for production.

#### `npm run build:backend`
Builds only the backend for production.

#### `npm run start`
Starts both servers in production mode.
- Uses built files instead of source files
- Lower resource usage than development
- Automatically cleans up old Node processes first
- **Must run `npm run build` first**

#### `npm run start:frontend`
Starts frontend in production mode.

#### `npm run start:backend`
Starts backend in production mode.

### Setup & Installation

#### `npm run setup`
**Recommended for first-time setup**
- Runs `npm run install:all`
- Creates `.env.local` files from examples
- Walks you through environment configuration
- One command to get started

#### `npm run install:all`
Installs npm dependencies for:
1. Root directory
2. Frontend directory
3. Backend directory

**Use this if you delete node_modules and need to reinstall.**

#### `npm run create:env`
Creates `.env.local` files from `.env.local.example` files if they don't exist.
- Safe to run multiple times
- Won't overwrite existing files
- Called automatically by `npm run setup`

### Maintenance & Debugging

#### `npm run clean`
Kills any Node.js processes running on ports 3000 and 3001.
- **Solves "EADDRINUSE" errors**
- Automatically called before `npm run dev` and `npm run start`
- Run manually if you need to stop servers: `npm run clean && npm run dev`

**Windows:**
```bash
npm run clean
```

**macOS/Linux:**
```bash
./kill-processes.sh
```

**Manual (all platforms):**
```bash
node kill-processes.js
```

#### `npm run debug`
Performs a comprehensive health check of the application.
- Checks Node.js and npm versions
- Verifies environment files exist
- Checks if dependencies are installed
- Verifies critical app files
- Shows port availability
- Provides recommendations

**Run this if having issues:**
```bash
npm run debug
```

#### `npm run lint`
Runs linting on both frontend and backend code.
- Checks for code style issues
- Runs ESLint on both projects
- Reports problems that should be fixed

---

## Common Workflows

### Workflow 1: Fresh Start (First Time)
```bash
npm run setup        # Install everything + create .env files
# Then edit .env files with your settings
npm run dev          # Start both servers
```

### Workflow 2: Resume Development (Next Day)
```bash
npm run dev          # Start both servers
# OR use the start.bat / start.sh scripts
```

### Workflow 3: Separate Terminals (Recommended)
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend  
cd backend && npm run dev
```

### Workflow 4: Fix "Port Already in Use"
```bash
npm run clean        # Kill existing processes
npm run dev          # Start fresh
```

### Workflow 5: Production Build & Run
```bash
npm run build        # Build optimized bundles
npm run start        # Run production servers
```

### Workflow 6: Debug Issues
```bash
npm run debug        # See health status
# Fix any issues reported
npm run dev          # Try again
```

---

## Command Details by Platform

### Windows Users

**Start with GUI (Recommended):**
```bash
start.bat
```
This script:
- Kills existing processes
- Checks for .env files
- Starts both servers
- Stays open (press a key to close)

**Start from command line:**
```bash
npm run dev
```

**Kill stuck processes:**
```bash
kill-processes.bat
npm run dev
```

### macOS/Linux Users

**Start with script:**
```bash
chmod +x start.sh     # First time: make executable
./start.sh            # Then run it
```

**Start from command line:**
```bash
npm run dev
```

**Kill stuck processes:**
```bash
chmod +x kill-processes.sh
./kill-processes.sh
npm run dev
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-id
PORT=3000
NODE_ENV=development
```

### Backend (.env.local)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crs
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=app-password
AUTHORITY_EMAIL=authority@example.com
PORT=3001
NODE_ENV=development
```

---

## Troubleshooting

### "Module not found" error
```bash
npm run install:all
npm run dev
```

### "EADDRINUSE: address already in use" error
```bash
npm run clean
npm run dev
```

### Database connection error
1. Check MySQL is running
2. Verify `backend/.env.local` has correct credentials
3. Confirm database `crs` exists

### "Cannot GET /api/*" error
- Verify backend is running on port 3001
- Check frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Check browser console (F12) for CORS errors

### Port 3000 or 3001 won't start
```bash
npm run debug        # Check port status
npm run clean        # Kill old processes
npm run dev          # Start fresh
```

---

## Tips & Tricks

1. **Keep terminals open:** Don't close the dev servers while working
2. **Check console logs:** Frontend (F12) and Backend (terminal) show errors
3. **Restart is fastest fix:** `npm run clean && npm run dev`
4. **One command setup:** `npm run setup` does everything
5. **Separate terminals:** Running frontend and backend separately is often more reliable
6. **Environment files:** Copy examples: `cp .env.local.example .env.local`

---

**Last Updated:** April 2026
**Next.js Version:** 16.2.4
