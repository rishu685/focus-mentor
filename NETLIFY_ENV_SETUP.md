# Netlify Environment Variables Setup

To fix the Study Buddy API issues on Netlify, you need to set the following environment variables in your Netlify dashboard:

## Go to Netlify Dashboard:
1. Visit https://app.netlify.com/
2. Select your `focus-mentor` site
3. Go to **Site settings** → **Environment variables**

## Required Environment Variables:

### Core Configuration
```
NODE_ENV=production
NEXTAUTH_SECRET=lzgap+5/FEZomzR5qGnCiZ3bvNN25SpmLemj09p+Y9M=
NEXTAUTH_URL=https://focus-mentor.netlify.app
```

### Database
```
MONGODB_URI=mongodb+srv://mindmentor:mindmentor@cluster0.4cz11zp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### API Configuration  
```
EXPRESS_BACKEND_URL=https://focus-mentor.netlify.app
NEXT_PUBLIC_API_URL=https://focus-mentor.netlify.app
API_URL=https://focus-mentor.netlify.app
```

### AI Services (Critical for Study Buddy)
```
GROQ_API_KEY=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
GROQ_API_KEY_RAG=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
TAVILY_API_KEY=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
HUGGINGFACE_API_KEY=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
```

### Analytics
```
NEXT_PUBLIC_POSTHOG_KEY=phc_WBhLimoIOPOcyq8xoYcjP0Dx89LeGuamKUe1BmVeWQq
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## After Setting Environment Variables:
1. **Redeploy** your site (Netlify will automatically redeploy when you save environment variables)
2. Wait for deployment to complete
3. Test the Study Buddy feature

## Changes Made:
✅ **Removed redirects**: Study Buddy API now uses Next.js routes instead of external backend
✅ **Fixed routing**: No more 404 errors from broken external server
✅ **Environment ready**: All required variables documented for Netlify

The Study Buddy should work correctly once these environment variables are set in Netlify!