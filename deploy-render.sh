#!/bin/bash

echo "🚀 Preparing backend for Render deployment..."

# Check if we're in the right directory
if [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Files prepared for Render deployment:"
echo "✅ server/package.json - Updated with Node.js engines"
echo "✅ server/.nvmrc - Node version specification"
echo "✅ RENDER_DEPLOY.md - Detailed deployment guide"

echo ""
echo "🎯 Next Steps:"
echo "1. Go to https://render.com"
echo "2. Sign in with GitHub"
echo "3. Create new Web Service from your repository"
echo "4. Use 'server' as root directory"
echo "5. Add your environment variables"
echo ""
echo "📖 Check RENDER_DEPLOY.md for detailed instructions!"

# Commit changes
echo "📝 Committing Render deployment files..."
git add server/.nvmrc server/package.json RENDER_DEPLOY.md
git commit -m "Prepare backend for Render deployment

- Add Node.js version specification
- Update package.json with engines
- Add Render deployment guide"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Ready for Render deployment!"
echo "Your backend URL will be: https://focus-mentor-backend.onrender.com"