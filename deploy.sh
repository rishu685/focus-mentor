#!/bin/bash

# Netlify Deployment Script for Mind Mentor

echo "🚀 Deploying Mind Mentor to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "🔧 Setup complete! Next steps:"
echo "1. Login to Netlify: netlify login"
echo "2. Initialize site: netlify init"
echo "3. Deploy: netlify deploy"
echo "4. Deploy to production: netlify deploy --prod"
echo ""
echo "📝 Don't forget to set your environment variables in the Netlify dashboard!"
echo "Check NETLIFY_DEPLOY.md for the complete guide."