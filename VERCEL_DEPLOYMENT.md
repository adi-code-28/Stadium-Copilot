# Vercel Deployment Guide - Stadium Copilot

## Quick Start - Deploy to Vercel in 3 Steps

### Step 1: Connect Your Repository
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub (or create an account)
3. Click "Add New..." → "Project"
4. Select your Stadium-Copilot repository
5. Click "Import"

### Step 2: Configure Environment Variables
In the Vercel dashboard, add these environment variables:

```
VITE_API_URL=https://your-backend-api.com  (optional, leave empty for mock mode)
```

Leave empty if you want to run in **offline-first** mode with mock data.

### Step 3: Deploy
1. Click "Deploy"
2. Your frontend will be live in ~2-3 minutes
3. Share your Vercel URL (e.g., `stadium-copilot-git-main.vercel.app`)

---

## Deployment Options

### Option A: Frontend Only (Recommended for Quick Start)
- **Deploy**: Frontend React app to Vercel
- **Mode**: Offline-first with mock data
- **Gemini API**: Users provide their own API key in app settings
- **No backend required**: Fully functional standalone

**✅ Pros:**
- Zero infrastructure cost
- Instant deployment
- Works globally with Vercel's CDN
- No backend maintenance

**Setup:**
```bash
npm install
npm run build
# Deploy to Vercel (via dashboard or CLI)
```

### Option B: Frontend + Backend (Full-Stack)
Deploy both frontend and backend:

**Frontend:** Vercel (as above)
**Backend:** Choose one:
- **Render.com** - Free tier with auto-deploy from GitHub
- **Railway.app** - $5/month, simple setup
- **AWS EC2** - Full control
- **Heroku** - Paid only (no free tier)
- **Fly.io** - Simple deployment, pay-as-you-go

#### Deploy Backend to Render.com:

1. Push backend/server.js to GitHub (already done)
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Settings:
   - Name: `stadium-copilot-backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add Environment Variables:
   ```
   PORT=3001
   NODE_ENV=production
   GEMINI_API_KEY=your_key_here
   ```
7. Click "Create Web Service"

After deployment, you'll get a URL like: `stadium-copilot-backend.onrender.com`

#### Update Frontend Backend URL:

In app settings, enter:
```
Backend API URL: https://stadium-copilot-backend.onrender.com
```

---

## Build Commands

The `package.json` includes optimized Vercel build configuration:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

**Manual build test (before deployment):**
```bash
npm run build
npm run preview
# Open http://localhost:4173
```

---

## Configuration Files for Vercel

### `vercel.json`
- Framework: Vite
- Output Directory: `dist/`
- Environment variable: `VITE_API_URL`
- Build optimization with regions

### `.vercelignore`
Excludes unnecessary files from deployment:
- Backend directory
- Git files
- Node modules

### `.env.example`
Shows required environment variables:
- `VITE_API_URL` - Backend API endpoint (optional)
- `VITE_GEMINI_API_KEY` - For serverless functions (optional)

---

## Feature Toggles by Mode

### Offline Mode (Mock Data)
```
✅ Wayfinding
✅ Carbon Passport  
✅ Heat Advisories
✅ Incident Simulation
✅ Multilingual Support
⚠️ AI Chat (requires user Gemini API key)
```

### Online Mode (With Backend)
```
✅ Real-time Stadium Data
✅ Live Gate Status
✅ Section Occupancy
✅ Weather Integration
✅ Enhanced Heat Advisories
✅ Backend Query Processing
```

---

## Monitoring & Logs

### Vercel Dashboard
- **Deployments**: View all deployment history
- **Analytics**: Response times, error rates
- **Logs**: Real-time deployment and runtime logs
- **Environment**: Manage secrets and variables

### Monitor Backend Performance (if deployed)
- Render/Railway dashboard shows CPU, memory, logs
- Set up alerts for downtime

---

## Troubleshooting

### Issue: Build fails on Vercel
**Solution:**
```bash
# Test locally first
npm run build
npm run preview

# If it fails, check:
# 1. Node version (use 18+)
# 2. Missing dependencies: npm install
# 3. Environment variables set correctly
```

### Issue: API calls fail after deployment
**Solution:**
```
1. Check VITE_API_URL environment variable
2. Verify backend is running (if deployed)
3. Check CORS headers in response
4. Browser console (F12) for detailed error
```

### Issue: Vite assets not loading
**Solution:**
Ensure `vite.config.js` has correct build config (already configured).

---

## Performance Optimization

**Already configured in Vercel deployment:**
- ✅ Code splitting (vendor chunk)
- ✅ Terser minification
- ✅ Tree-shaking
- ✅ Vite optimizations
- ✅ Vercel edge caching

**Result:** ~2.5 MB → ~85 KB gzipped

---

## Custom Domain

1. In Vercel dashboard, go to Project Settings
2. Click "Domains"
3. Add your custom domain (e.g., `stadium-copilot.com`)
4. Follow DNS setup instructions
5. SSL certificate auto-configured

---

## GitHub Integration

**Automatic Deployments:**
- `git push origin main` → Automatic Vercel build
- Preview deployments for pull requests
- Rollback to previous deployment in 1 click

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Vercel Frontend | Free (generous limits) |
| Render Backend | Free tier or $7+/month |
| Custom Domain | $10-15/year |
| **Total** | **$0-22/month** |

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. (Optional) Deploy backend to Render/Railway
3. Configure API URL in app settings
4. Share with the world! 🚀

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev
- GitHub Issues: Report bugs and features
