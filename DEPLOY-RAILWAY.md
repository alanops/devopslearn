# Deploying to Railway + Netlify

This guide shows how to deploy the DevOps Learn platform using Railway for the backend and Netlify for the frontend.

## Architecture

- **Frontend**: Static Next.js site deployed to Netlify
- **Backend**: Node.js WebSocket server deployed to Railway with Docker support

## Step 1: Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Connect Repository**: Select your backend repository
4. **Configure Environment Variables**:
   ```
   FRONTEND_URL=https://your-netlify-site.netlify.app
   NODE_ENV=production
   ```
5. **Deploy**: Railway will automatically detect the Dockerfile and deploy

## Step 2: Deploy Frontend to Netlify

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `out`
   
2. **Environment Variables**:
   ```
   NEXT_PUBLIC_WS_URL=wss://your-railway-app.railway.app
   ```

3. **Deploy**: Connect your GitHub repo and deploy

## Step 3: Update CORS

After deployment, update the Railway backend environment variable:
```
FRONTEND_URL=https://your-actual-netlify-domain.netlify.app
```

## Local Development

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   npm install
   NEXT_PUBLIC_WS_URL=ws://localhost:3001 npm run dev
   ```

## Cost Breakdown

- **Railway**: $5/month free credit (should cover small projects)
- **Netlify**: Free tier (100GB bandwidth, unlimited sites)
- **Total**: $0/month for starter projects

## Benefits

- ✅ No time limits (unlike Heroku)
- ✅ Auto-scaling
- ✅ Docker support for scenarios
- ✅ WebSocket support
- ✅ Free tier generous enough for learning projects