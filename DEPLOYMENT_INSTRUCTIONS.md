# Deployment Instructions for Admin Dashboard Fix

## What Was Fixed

1. **API URL Mismatch**: Updated all API calls to use `/api/v1/` instead of `/api/`
2. **Admin Authorization**: Added proper authentication and role verification to admin dashboard
3. **Environment Configuration**: Created production environment file with correct API endpoints
4. **Build Configuration**: Updated Next.js config to use correct default API URL

## Current Status

✅ Code changes committed and pushed to branch: `claude/fix-typescript-errors-01HVNL7voRXYbQ5YxTV1q8CY`
✅ Frontend built successfully with production configuration
⚠️  **Production deployment pending** (requires Firebase authentication)

## How to Deploy to Production

### Option 1: Deploy from Your Local Machine (Recommended)

1. **Pull the latest changes:**
   ```bash
   git pull origin claude/fix-typescript-errors-01HVNL7voRXYbQ5YxTV1q8CY
   ```

2. **Build the frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Deploy to Firebase:**
   ```bash
   npm install
   npx firebase deploy --only hosting
   ```

   Or if you have firebase-tools installed globally:
   ```bash
   firebase deploy --only hosting
   ```

### Option 2: Use GitHub Actions (If Configured)

If you have GitHub Actions set up for deployment:
1. Merge the branch to your main branch
2. The deployment should trigger automatically

### Option 3: Deploy Only Frontend (Quick)

If you only want to deploy the frontend changes:
```bash
cd frontend
npm run build
cd ..
npx firebase deploy --only hosting
```

## Verification

After deployment, verify the fixes by:

1. **Visit the admin dashboard**: https://remiepay.web.app/admin
2. **Check browser console**: Ensure no 404 errors for:
   - `/api/v1/admin/stats` (was failing at `/api/admin/stats`)
   - `/api/v1/auth/me` (was failing at `/api/auth/me`)
   - `/api/v1/admin/users/pending-approval`
3. **Test authorization**:
   - Non-admin users should be redirected to `/dashboard`
   - Only users with ADMIN role can access admin dashboard

## Files Changed

### Frontend Code
- `frontend/src/lib/api.ts` - Updated API base URL to `/api/v1`
- `frontend/src/app/admin/page.tsx` - Added admin authorization checks
- `frontend/src/contexts/AuthContext.tsx` - Updated API URL
- `frontend/src/app/dashboard/loans/page.tsx` - Updated API URL

### Configuration
- `frontend/.env.production` - NEW: Production environment variables
- `frontend/next.config.js` - Updated default API URL
- `.env.production` - Updated root environment file
- `frontend/.env.example` - Updated example environment file

## Troubleshooting

### If you still see 404 errors after deployment:

1. **Clear browser cache**: Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Check deployment**: Verify the deployment completed successfully
3. **Check Firebase console**: Ensure the hosting deployment is live
4. **Check API routes**: Verify your backend/functions are deployed and responding at `/api/v1/`

### If admin dashboard redirects immediately:

1. Ensure you're logged in with an admin account
2. Check that your user has `role: 'ADMIN'` in the database
3. Verify the `/api/v1/auth/me` endpoint is working

## Backend API Note

The backend routes are configured at `/api/v1/admin/*` in the Firebase Functions. Ensure your backend deployment includes these routes:
- `/api/v1/admin/stats`
- `/api/v1/admin/users`
- `/api/v1/admin/users/pending-approval`
- `/api/v1/admin/activities`
- `/api/v1/auth/me`

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Check Firebase Functions logs: `firebase functions:log`
3. Verify environment variables are set correctly
4. Ensure your backend is deployed and running
