# Netlify Deployment Checklist

## Pre-deployment Steps

### 1. Environment Variables ✓
Ensure these are set in Netlify Dashboard (Site Settings → Environment Variables):

**Required:**
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_BACKEND_URL=https://focus-mentor-backend.onrender.com`
- [ ] `NEXTAUTH_SECRET=your_random_secret_here`
- [ ] `NEXTAUTH_URL=https://your-site.netlify.app`
- [ ] `MONGODB_URI=your_mongodb_connection_string`

**Optional (for full functionality):**
- [ ] `GROQ_API_KEY=your_key` (AI features)
- [ ] `TAVILY_API_KEY=your_key` (search features)
- [ ] `HUGGINGFACE_API_KEY=your_key` (embeddings)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY=your_key` (analytics)
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (OAuth)

### 2. Backend Service Status ✓
- [ ] Verify external backend is running: https://focus-mentor-backend.onrender.com
- [ ] Test backend health endpoint
- [ ] Confirm database connectivity from backend

### 3. Configuration Files ✓
- [x] `netlify.toml` updated with correct settings
- [x] No conflicting redirects (all API routes handled by Next.js)
- [x] Build command configured correctly
- [x] Environment variables in build environment

### 4. Code Verification ✓
- [x] All API routes use `NEXT_PUBLIC_BACKEND_URL` properly
- [x] No hardcoded localhost URLs in production code
- [x] Proper fallback handling for environment variables
- [x] NextAuth configuration matches domain

### 5. Database Configuration
- [ ] MongoDB whitelist includes Netlify IP ranges (or 0.0.0.0/0)
- [ ] Connection string includes proper authentication
- [ ] Database accessible from external services

## Deployment Process

### Method 1: Git-based Deployment (Recommended)
1. Push all changes to GitHub
2. Connect repository to Netlify
3. Netlify auto-detects build settings from `netlify.toml`
4. Set environment variables
5. Deploy

### Method 2: Manual Deployment
1. Run `npm run build` locally
2. Upload `.next` folder to Netlify
3. Configure environment variables

## Post-deployment Testing

### Critical Functionality to Test:
- [ ] User authentication (signin/signup)
- [ ] Study plan generation
- [ ] Resource curation
- [ ] PDF upload and chat
- [ ] Syllabus upload
- [ ] Meeting rooms
- [ ] Resource deletion

### Common Issues & Solutions:

**API Routes Failing:**
- Check `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Verify backend service is running
- Check MongoDB connectivity

**Authentication Issues:**
- Ensure `NEXTAUTH_URL` matches actual site URL
- Verify `NEXTAUTH_SECRET` is set and secure
- Check OAuth provider settings if using social auth

**Build Failures:**
- Check Node.js version compatibility (requires Node 20+)
- Verify all dependencies are in package.json
- Check for TypeScript/ESLint errors

**Environment Variable Issues:**
- Ensure variables are set in Netlify dashboard, not just .env files
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces or quotes

## Monitoring

After deployment, monitor:
- [ ] Function logs in Netlify dashboard
- [ ] API response times and errors
- [ ] Database connection stability
- [ ] User authentication flows

## Rollback Plan

If deployment fails:
1. Check Netlify function logs
2. Verify environment variables
3. Test backend service independently
4. Rollback to previous deployment if needed
5. Fix issues and redeploy

## Performance Optimization

For production:
- [ ] Enable gzip compression (auto in Netlify)
- [ ] Configure CDN caching
- [ ] Monitor API response times
- [ ] Set appropriate cache headers
- [ ] Consider implementing API rate limiting