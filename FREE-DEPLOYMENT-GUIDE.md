# Free Production Deployment Guide for VitalFlow

Deploy your VitalFlow application for free using these cloud services:

## 🆓 Free Hosting Stack

- **Frontend**: Vercel (Free)
- **Backend**: Railway (Free tier - $5/month credit)
- **Database**: Supabase (Free tier)
- **Redis**: Upstash (Free tier)
- **File Storage**: Cloudinary (Free tier)

## 🚀 Quick Start

### Step 1: Database Setup (Supabase)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub
   - Create new project

2. **Get Database Credentials**
   ```bash
   # In Supabase Dashboard:
   # Project Settings > Database > Connection string
   # Copy the connection string
   ```

3. **Run Database Schema**
   ```sql
   -- In Supabase SQL Editor, run your schema
   -- Copy contents from backend/prisma/schema.prisma
   -- Or use the migration files
   ```

### Step 2: Redis Setup (Upstash)

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up for free
   - Create Redis database

2. **Get Redis URL**
   ```bash
   # In Upstash Dashboard:
   # Copy the REST URL or connection string
   ```

### Step 3: Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Prepare Backend**
   ```bash
   # In your backend folder
   npm install
   # Create railway.toml (see below)
   ```

3. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

### Step 4: Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   ```bash
   # In your frontend folder
   npm install
   npm run build
   vercel --prod
   ```

## 📁 Configuration Files

### Railway Configuration (railway.toml)

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "app"

[services.variables]
NODE_ENV = "production"
PORT = "4000"
```

### Vercel Configuration (vercel.json)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 🔧 Environment Variables

### Backend (Railway)

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
REDIS_URL=redis://default:[password]@[host].upstash.io:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=https://your-app.vercel.app

# Email (SendGrid - optional)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@your-app.vercel.app

# SMS (Twilio - optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend-app.railway.app
NEXT_PUBLIC_APP_NAME=VitalFlow
```

## 📱 Step-by-Step Guide

### 1. Supabase Database Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Choose organization
   - Set project password (save it!)
   - Choose region closest to you

2. **Get Connection String**
   - Go to Project Settings > Database
   - Copy "Connection string"
   - Format: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

3. **Run Database Schema**
   - Go to SQL Editor
   - Copy and paste your database schema
   - Click "Run"

4. **Seed Data (Optional)**
   - Run your seed script in SQL Editor
   - Or use the Supabase interface to add data

### 2. Upstash Redis Setup

1. **Create Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up for free
   - Create new Redis database

2. **Get Connection Details**
   - Copy the REST URL or connection string
   - Format: `redis://default:[password]@[host].upstash.io:6379`

### 3. Railway Backend Deployment

1. **Prepare Repository**
   ```bash
   # Make sure your backend is in a Git repository
   git init
   git add .
   git commit -m "Initial backend setup"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Connect your GitHub repository
   - Select your backend folder

3. **Configure Environment**
   - Go to project settings
   - Add all environment variables from above
   - Click "Deploy"

4. **Get Backend URL**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Copy this for frontend configuration

### 4. Vercel Frontend Deployment

1. **Prepare Repository**
   ```bash
   # Make sure your frontend is in a Git repository
   git init
   git add .
   git commit -m "Initial frontend setup"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Connect your GitHub repository
   - Select your frontend folder

3. **Configure Environment**
   - Add `NEXT_PUBLIC_API_URL` with your Railway URL
   - Click "Deploy"

4. **Get Frontend URL**
   - Vercel will give you a URL like: `https://your-app.vercel.app`

## 🔄 CORS Configuration

Update your backend CORS settings to allow your Vercel domain:

```javascript
// In your backend CORS configuration
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000' // for development
  ],
  credentials: true
};
```

## 📊 Free Tier Limits

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel | Free | 100GB bandwidth, 100 builds/month |
| Railway | $5 credit | ~500 hours/month |
| Supabase | Free | 500MB database, 50MB file storage |
| Upstash | Free | 10,000 commands/month |
| Cloudinary | Free | 25GB storage, 25GB bandwidth/month |

## 🛠️ Management

### Railway Commands
```bash
# View logs
railway logs

# View status
railway status

# Redeploy
railway up

# Open in browser
railway open
```

### Vercel Commands
```bash
# View logs
vercel logs

# Redeploy
vercel --prod

# View deployment
vercel inspect
```

### Database Management
- Use Supabase Dashboard for database management
- Built-in table editor, SQL editor, and API explorer

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure backend allows frontend domain
   - Check environment variables are correct

2. **Database Connection**
   - Verify Supabase connection string
   - Check if database is running

3. **Redis Connection**
   - Verify Upstash connection string
   - Check Redis URL format

4. **Build Failures**
   - Check build logs
   - Ensure all dependencies are in package.json

### Debugging Tips

1. **Check Logs**
   - Railway: `railway logs`
   - Vercel: `vercel logs`

2. **Test Locally**
   - Run backend locally with production env
   - Test frontend locally with production API

3. **Environment Variables**
   - Double-check all URLs and keys
   - Make sure no trailing slashes

## 🚀 Going Live

Once deployed:

1. **Test Everything**
   - Create test account
   - Test all features
   - Check file uploads

2. **Set Up Custom Domain** (Optional)
   - Vercel: Add custom domain in dashboard
   - Railway: Add custom domain in settings

3. **Monitor Usage**
   - Keep an eye on free tier limits
   - Set up alerts if available

## 💰 Cost Optimization

To stay within free tiers:
- Optimize images and files
- Implement caching
- Monitor database queries
- Clean up unused data

## 📞 Support

- **Vercel**: vercel.com/docs
- **Railway**: docs.railway.app
- **Supabase**: supabase.com/docs
- **Upstash**: upstash.com/docs

Your VitalFlow application is now live for free! 🎉
