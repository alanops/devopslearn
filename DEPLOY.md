# Deploy YouTube Thumbnail Resizer to Netlify

## 🚀 Quick Deploy

### Option 1: Drag & Drop (Easiest)
1. Run build: `npm run build`
2. Go to [netlify.com](https://netlify.com) and create account
3. Drag the `out` folder to Netlify's deploy area
4. Your site will be live at `https://random-name.netlify.app`

### Option 2: Git Deploy (Recommended)
1. Push code to GitHub repository
2. Connect repository to Netlify
3. Netlify will auto-build using `netlify.toml` settings

### Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=out
```

## 📁 Project Structure for Netlify

```
/workspaces/devopslearn/
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       └── thumbnail-resize.js  # Server-side image processing
├── out/                      # Built static files (auto-generated)
├── src/
│   ├── pages/
│   │   └── tools/
│   │       └── thumbnail-resizer.tsx  # Frontend UI
│   └── utils/
│       └── thumbnail-resizer.ts       # Utility functions
└── next.config.js           # Next.js configuration for static export
```

## ⚙️ Configuration Files

### netlify.toml
- Builds static files to `out/` directory
- Configures Netlify Functions
- Sets up redirects and CORS headers

### next.config.js
- Enables static export with `output: 'export'`
- Disables image optimization for static hosting
- Optimizes build for deployment

## 🔧 Environment Requirements

### Netlify Functions:
- Node.js 18+
- Sharp (for server-side image processing)
- lambda-multipart-parser (for file uploads)

### Frontend:
- Static HTML/CSS/JS (no server required)
- React + Next.js (client-side only)
- Tailwind CSS for styling

## 🌐 Live URL
After deployment, your thumbnail resizer will be available at:
- `https://your-site.netlify.app/tools/thumbnail-resizer`

## 🐞 Troubleshooting

### Build Issues:
- Ensure all dependencies are installed: `npm install`
- Check build logs in Netlify dashboard
- Verify `out/` directory exists after build

### Function Issues:
- Check function logs in Netlify dashboard
- Verify Sharp binary compatibility with Netlify's environment
- Test function endpoint: `/.netlify/functions/thumbnail-resize`

### CORS Issues:
- CORS headers are configured in `netlify.toml`
- Test with browser dev tools network tab

## 📊 Usage Stats
Monitor usage in Netlify dashboard:
- Function invocations
- Bandwidth usage
- Build minutes

Free tier includes:
- 125K function requests/month
- 100GB bandwidth/month
- 300 build minutes/month