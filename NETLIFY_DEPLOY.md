# Netlify Deployment Guide for Mind Mentor

## Prerequisites
1. A Netlify account
2. Your repository hosted on GitHub, GitLab, or Bitbucket
3. Environment variables configured

## Environment Variables
Set these environment variables in your Netlify dashboard (Site settings → Environment variables):

### Required Variables:
- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - A random secret for NextAuth.js
- `NEXTAUTH_URL` - Your Netlify site URL (e.g., https://your-site.netlify.app)
- `NEXT_PUBLIC_BACKEND_URL` - External backend URL: `https://focus-mentor-backend.onrender.com`
- `NODE_ENV` - Set to `production`

### Optional Variables (based on your features):
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth  
- `GROQ_API_KEY` - For AI services
- `OPENAI_API_KEY` - If using OpenAI
- Any other API keys your app requires

## Deploy Steps:

### Method 1: Connect Git Repository (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Login to Netlify Dashboard
3. Click "New site from Git"
4. Connect your repository
5. Netlify will automatically detect the build settings from `netlify.toml`
6. Add your environment variables
7. Deploy!

### Method 2: Manual Deploy
1. Run `npm run build` locally
2. Drag and drop the `.next` folder to Netlify deploy area
3. Configure environment variables manually

## Important Notes:

### Database Considerations:
- Make sure your MongoDB instance allows connections from Netlify
- Consider using MongoDB Atlas for better reliability
- Whitelist Netlify's IP ranges or use 0.0.0.0/0 (less secure)

### File Uploads:
- Your current file upload functionality may not work on Netlify
- Consider using cloud storage (AWS S3, Cloudinary) for file uploads
- The `uploads/` directory will be ephemeral in serverless functions

### WebSocket Limitations:
- Netlify Functions don't support WebSocket connections
- Your Socket.IO features won't work
- Consider using Netlify's real-time features or external WebSocket services

### Function Timeout:
- Netlify Functions have a 10-second timeout on the free plan
- 26 seconds on Pro plans
- Optimize long-running operations

## Troubleshooting:

### Build Fails:
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### API Routes Don't Work:
- Check that serverless function is deployed correctly
- Verify environment variables are accessible
- Check function logs in Netlify dashboard

### Database Connection Issues:
- Ensure MongoDB URI is correct
- Check if MongoDB Atlas allows Netlify connections
- Verify connection string format

## Post-Deployment:
1. Test all functionality
2. Update any hardcoded URLs to your Netlify domain
3. Configure custom domain if desired
4. Set up monitoring and analytics