# Full-Stack Railway Deployment

Deploy the entire DevOps Learn platform to Railway as a single service.

## Architecture

- **Single Railway Service**: Backend serves both WebSocket API and static frontend
- **Frontend**: Next.js static export served by Express
- **Backend**: Node.js WebSocket server with Docker scenario support
- **Scenarios**: Kubernetes containers with kind clusters

## Deployment Steps

### 1. Deploy to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. **Select this repository** (root directory)
4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   ```
5. **Deploy**: Railway will use the root Dockerfile automatically

### 2. How It Works

1. **Build Process**:
   - Frontend builds to static files (`out/`)
   - Backend TypeScript compiles to JavaScript
   - Docker scenario images are built
   - Everything is packaged in a single container

2. **Runtime**:
   - Express server serves static frontend files
   - Same server handles WebSocket connections for scenarios
   - Frontend connects to backend on same domain (no CORS issues)

### 3. Benefits

✅ **Simplified Deployment**: One service, one URL  
✅ **No CORS Issues**: Frontend and backend on same domain  
✅ **Cost Effective**: Single Railway service ($5/month free credit)  
✅ **Docker Support**: Full scenario functionality  
✅ **WebSocket Support**: Real-time terminal connections  

### 4. Local Development

```bash
# Frontend development
npm run dev

# Backend development  
cd src/server
npm run dev

# Full stack test
npm run build
npm run railway:start
```

### 5. Environment Variables

**Required**:
- `PORT` - Server port (set by Railway automatically)

**Optional**:
- `NODE_ENV=production` 
- `FRONTEND_URL` - For CORS (not needed in full-stack mode)

## File Structure

```
/
├── Dockerfile                 # Full-stack Railway build
├── railway.toml              # Railway configuration
├── src/
│   ├── components/           # React components
│   ├── pages/               # Next.js pages
│   └── server/              # Backend WebSocket server
├── scenarios/               # Docker scenario definitions
├── docker/                  # Docker base images
└── public/                  # Static assets
```

## Cost Estimate

- **Railway**: $5/month free credit
- **Total**: $0/month for starter projects

Perfect for learning and prototyping! 🚀