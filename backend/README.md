# DevOps Learn - Backend

WebSocket server for the DevOps Learning Platform that manages interactive scenario containers.

## Features

- WebSocket server for real-time terminal communication
- Docker container management for scenarios
- Kubernetes scenario support with kind clusters
- Automatic Docker network creation
- Image validation and error handling

## Railway Deployment

This backend is designed to be deployed on Railway with Docker support.

### Environment Variables

- `PORT` - Server port (automatically set by Railway)
- `FRONTEND_URL` - Frontend URL for CORS (set to your Netlify URL)

### Deployment Steps

1. Connect this repository to Railway
2. Set environment variables
3. Deploy automatically

## Local Development

```bash
npm install
npm run dev
```

## Building Scenario Images

```bash
make scenario-build
```