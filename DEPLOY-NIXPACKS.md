# Railway Deployment with Nixpacks

This version uses Railway's native Nixpacks builder instead of Docker to avoid registry timeout issues.

## How It Works

1. **Nixpacks Builder**: Railway's native builder (no Docker registry required)
2. **Frontend Build**: Next.js builds to static files
3. **Backend Build**: TypeScript compiles to JavaScript  
4. **Demo Mode**: Runs without Docker scenarios initially

## Deployment Steps

1. **Push to GitHub** (already done)
2. **Deploy to Railway**:
   - Connect your GitHub repo
   - Railway will auto-detect and use Nixpacks
   - No environment variables needed
3. **Access**: Visit your Railway URL

## What Works

✅ **Frontend**: Full Next.js application  
✅ **Backend**: WebSocket server for future scenarios  
✅ **Demo Mode**: Shows friendly message for scenarios  
✅ **Fast Build**: No Docker registry downloads  

## Adding Docker Later

When you need full scenario support:
1. Rename `Dockerfile.backup` to `Dockerfile`
2. Update `railway.toml` to use `dockerfile` builder
3. Deploy to a Docker-enabled platform (or wait for Railway Docker support)

## Benefits

- **No registry timeouts** 
- **Faster builds**
- **Railway's optimized Node.js environment**
- **Perfect for demos and frontend showcasing**

This gets your platform live immediately! 🚀