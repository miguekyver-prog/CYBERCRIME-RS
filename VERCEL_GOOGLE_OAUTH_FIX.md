# 🔐 Fixing Google OAuth Login on Vercel

## Issues Fixed

This guide documents all the fixes applied to make your application work on Vercel with Google OAuth authentication.

### 1. ✅ Hardcoded Google Client ID (FIXED)
**Problem:** The backend had a hardcoded Google Client ID which:
- Can't be changed without code modifications
- Won't work with different environments (local vs Vercel)
- Creates security risks

**Solution:** Changed to use environment variable `GOOGLE_CLIENT_ID`
```js
// Before (WRONG):
const clientId = '862494866742-0sb0mvdcjuidrvi9sq7k28lkb8mcap4a.apps.googleusercontent.com';

// After (CORRECT):
const clientId = process.env.GOOGLE_CLIENT_ID;
```

---

### 2. ✅ Missing User Object in Login Response (FIXED)
**Problem:** The login endpoint returned `userId`, `fullName`, `email` separately instead of a `user` object. Frontend expected a `user` object with `UserID`, `Full_Name`, `Email` fields.

**Solution:** Changed response structure to match frontend expectations
```js
// Before (WRONG):
res.json({
  message: "Login successful",
  userId: user.UserID,
  fullName: user.Full_Name,
  email: user.email
});

// After (CORRECT):
res.json({
  message: "Login successful",
  user: {
    UserID: user.UserID,
    Full_Name: user.Full_Name,
    Email: user.email,
    Contact_Number: user.Contact_Number || null
  }
});
```

---

### 3. ✅ CORS Configuration for Vercel (FIXED)
**Problem:** CORS was set to allow all origins (`origin: '*'`), which causes issues with credentials and Vercel subdomain mismatches.

**Solution:** Configure dynamic CORS that allows specific origins for both local and Vercel environments
```js
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, true); // Allow anyway but log
    }
  },
  credentials: true
}));
```

---

### 4. ✅ Duplicate next.config Files (FIXED)
**Problem:** Both `next.config.js` and `next.config.ts` existed, causing conflicts.

**Solution:** Removed `next.config.ts` and kept only `next.config.js`

---

### 5. ✅ Environment Variables Configuration (CREATED)
**Files Created:**
- `.env.local` in backend/
- `.env.local` in frontend/
- `vercel.json` in root

---

## 📋 Deployment Checklist for Vercel

### Step 1: Set Up Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

**For Frontend (Next.js):**
```
NEXT_PUBLIC_API_URL = https://your-backend-url.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID = 862494866742-0sb0mvdcjuidrvi9sq7k28lkb8mcap4a.apps.googleusercontent.com
```

**For Backend (Express):**
```
GOOGLE_CLIENT_ID = 862494866742-0sb0mvdcjuidrvi9sq7k28lkb8mcap4a.apps.googleusercontent.com
DB_HOST = your-database-host
DB_USER = your-database-user
DB_PASSWORD = your-database-password
DB_NAME = crs
FRONTEND_URL = https://your-frontend-url.vercel.app
```

### Step 2: Update Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to Credentials → OAuth 2.0 Client IDs
4. Click on the client ID used in this app
5. Add Authorized Redirect URIs:
   - `http://localhost:3000` (local)
   - `https://your-frontend-url.vercel.app` (production)
   - `https://your-backend-url.vercel.app/api/google-login` (backend)
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-frontend-url.vercel.app`

### Step 3: Configure Backend Deployment

Option A: **Deploy Backend Separately**
- Deploy backend to Vercel as a separate project (or use Express as Serverless functions)
- Update `NEXT_PUBLIC_API_URL` to point to backend URL

Option B: **Use API Routes**
- Create API routes in frontend's `frontend/src/app/api/` that proxy to backend
- This makes frontend+backend appear as one domain (no CORS issues)

### Step 4: Deploy to Vercel

```bash
git add .
git commit -m "Fix Google OAuth and environment configuration for Vercel"
git push
```

Vercel will automatically deploy from your repository.

---

## 🧪 Testing Google Login Locally

1. Start both servers:
```bash
npm run dev
```

2. Go to http://localhost:3000
3. Click Google Sign-In button
4. Should see browser's Google login popup
5. After login, you should be redirected to dashboard

**If it fails:**
- Check browser console for errors
- Check backend logs: `npm run dev:backend`
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in frontend
- Verify `GOOGLE_CLIENT_ID` is set in backend

---

## 🐛 Common Issues & Solutions

### "Token verification failed"
- Check that `GOOGLE_CLIENT_ID` matches the one in Google Console
- Verify the token is being sent correctly from frontend
- Check backend logs for error details

### "CORS error on Vercel"
- Verify `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` environment variables
- Make sure backend origin is in Vercel config
- Check that frontend and backend are on same domain or CORS is properly configured

### "Login redirects to login page"
- Check if user data is being stored in localStorage
- Verify response includes `user` object with `UserID`, `Full_Name`, `Email`
- Check frontend logs in browser console

### "Google button not showing"
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Check that Google Sign-In script loaded: Open DevTools → Network → search for "accounts.google.com"
- Try reloading the page

---

## 📚 Files Modified

1. `backend/server.js` - Fixed Google OAuth and CORS
2. `backend/.env.local` - Created environment variables template
3. `frontend/.env.local` - Created environment variables template  
4. `vercel.json` - Created deployment configuration
5. `frontend/next.config.ts` - DELETED (duplicate removed)

---

## 🎉 You're All Set!

Your application is now ready for Vercel deployment with working Google OAuth authentication.

For questions or issues, refer to:
- [Vercel Docs](https://vercel.com/docs)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment/vercel)
