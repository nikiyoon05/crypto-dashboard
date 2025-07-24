#  Deployment Guide - Render

This guide will help you deploy the Crypto Tracker app to Render for free.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **CoinMarketCap API Key**: Get one from [coinmarketcap.com/api](https://coinmarketcap.com/api/)

## 🔧 Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub with all the latest changes:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy via Render Dashboard

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Set environment variables:
   - `COINMARKETCAP_API_KEY`: Your API key from CoinMarketCap

#### Option B: Manual Service Creation

**Backend Service:**
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `crypto-tracker-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `COINMARKETCAP_API_KEY`: Your API key
   - `DATABASE_PATH`: `./data/crypto_tracker.db`

**Frontend Service:**
1. Click **"New"** → **"Static Site"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `crypto-tracker-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: `Free`
4. Add environment variable:
   - `REACT_APP_API_URL`: `https://crypto-tracker-api.onrender.com/api`

### 3. Configure Environment Variables

In your Render dashboard, add these environment variables:

**Backend Service:**
- `COINMARKETCAP_API_KEY`: Your actual API key
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render default)
- `DATABASE_PATH`: `./data/crypto_tracker.db`

**Frontend Service:**
- `REACT_APP_API_URL`: `https://[your-backend-service-name].onrender.com/api`

### 4. Deploy

Once configured, Render will automatically:
1. Build both services
2. Deploy the backend API
3. Deploy the frontend static site
4. Provide you with live URLs

## 🔗 Access Your App

After deployment, you'll get URLs like:
- **Frontend**: `https://crypto-tracker-frontend.onrender.com`
- **Backend API**: `https://crypto-tracker-api.onrender.com`

##  Important Notes

### Free Tier Limitations
- **Cold starts**: Services may take 30-60 seconds to wake up after inactivity
- **Monthly hours**: 750 hours per month for free services
- **Persistence**: SQLite database will persist but may be reset on service restarts

### Performance Tips
- The app may be slow on first load due to cold starts
- Consider upgrading to paid plans for production use
- Database will be recreated on each deployment (expected behavior)

##  Troubleshooting

### Common Issues

**Build Failures:**
- Check that all dependencies are in `package.json`
- Ensure build commands are correct
- Check Node.js version compatibility

**CORS Errors:**
- Verify frontend URL is correctly set in backend CORS config
- Check environment variables are properly set

**API Key Issues:**
- Ensure `COINMARKETCAP_API_KEY` is set in backend service
- Verify the API key is valid and has proper permissions

**Database Issues:**
- SQLite database is created automatically on first run
- Data will be lost on service restarts (free tier limitation)

### Logs and Debugging

Access logs in Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Check for error messages

##  Updates and Redeployment

Render automatically redeploys when you push to your connected GitHub branch:

```bash
git add .
git commit -m "Update app"
git push origin main
```

##  Next Steps

After successful deployment:
1. Test all features work correctly
2. Share your live app URL
3. Consider setting up custom domain (paid feature)
4. Monitor usage and performance

---

** Congratulations!** Your Crypto Tracker is now live on the web! 