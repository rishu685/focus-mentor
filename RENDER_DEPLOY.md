# Render Deployment Guide for Backend

## 🚀 Deploy Backend to Render

### Step 1: Go to Render
1. Visit [render.com](https://render.com)
2. Sign up/login with your GitHub account

### Step 2: Create Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `focus-mentor-`

### Step 3: Configure Service
Fill in these settings:
```
Name: focus-mentor-backend
Environment: Node
Region: Oregon (US-West) or nearest to you
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### Step 4: Add Environment Variables
Click "Advanced" and add these environment variables:

**Required:**
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/mindmentor?retryWrites=true&w=majority
GROQ_API_KEY=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
GROQ_API_KEY_RAG=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
PORT=10000
NODE_ENV=production
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)

### Step 6: Get Your Backend URL
After deployment, you'll get a URL like:
```
https://focus-mentor-backend.onrender.com
```

### Step 7: Update Netlify Frontend
In your Netlify dashboard, add/update this environment variable:
```
EXPRESS_BACKEND_URL=https://focus-mentor-backend.onrender.com
```

### Step 8: Test Backend
Visit your backend URL + `/api/health` to test:
```
https://focus-mentor-backend.onrender.com/api/health
```

Should return: `{"status":"OK","timestamp":"..."}`

## 🔧 Troubleshooting

**Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in server/package.json

**App Doesn't Start:**
- Verify start command is `npm start`
- Check environment variables are set correctly
- Look at deploy logs for errors

**Database Connection Issues:**
- Verify MongoDB URI is correct
- Check MongoDB Atlas allows connections from 0.0.0.0/0

## 💡 Free Tier Limits
- ✅ 750 hours/month free
- ⚠️ Sleeps after 15min inactivity
- ⚠️ Takes ~30s to wake up
- ✅ 512MB RAM