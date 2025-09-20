# Deployment Guide - RecurAI Resume Parser

This guide will walk you through deploying the RecurAI Resume Parser application to Vercel with a separate backend deployment.

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Vercel account
- Railway/Render account (for backend)
- AWS account (for S3 storage)
- OpenRouter account (for AI API)
- Clerk account (for authentication)

## 📋 Step-by-Step Deployment

### 1. Frontend Deployment (Vercel)

#### Option A: Deploy from GitHub
1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `https://github.com/Aasrith26/kanyarashi.git`

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
   CLERK_SECRET_KEY=sk_live_your_key_here
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app.vercel.app`

#### Option B: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Backend Deployment (Railway)

#### Setup Railway
1. **Create Account**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Select the `JD-ResAIAgent` folder
   - Railway will auto-detect Python

4. **Set Environment Variables**
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_s3_bucket_name
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```

5. **Add PostgreSQL Database**
   - In Railway dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will provide the DATABASE_URL

6. **Deploy**
   - Railway will automatically deploy
   - Note the generated URL (e.g., `https://your-app.railway.app`)

### 3. Database Setup

#### Initialize Database
```bash
# Connect to your Railway PostgreSQL
psql $DATABASE_URL

# Run schema
\i database/schema.sql
\i database/init.sql
```

### 4. AWS S3 Setup

1. **Create S3 Bucket**
   - Go to AWS S3 Console
   - Create new bucket
   - Enable versioning
   - Set appropriate permissions

2. **Create IAM User**
   - Go to AWS IAM Console
   - Create new user with programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Save Access Key ID and Secret Access Key

### 5. Clerk Authentication Setup

1. **Create Clerk Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create new application
   - Configure sign-in/sign-up URLs

2. **Configure Domains**
   - Add your Vercel domain
   - Set redirect URLs

### 6. OpenRouter API Setup

1. **Create Account**
   - Go to [OpenRouter.ai](https://openrouter.ai)
   - Sign up and get API key

2. **Configure Model**
   - Use Qwen 3-14B model
   - Set appropriate rate limits

## 🔧 Environment Variables Reference

### Frontend (Vercel)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

### Backend (Railway)
```env
OPENROUTER_API_KEY=sk-or-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
DATABASE_URL=postgresql://...
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
- Check environment variables are set correctly
- Ensure all dependencies are in package.json
- Check for TypeScript errors

#### 2. Backend Connection Issues
- Verify BACKEND_URL is correct
- Check CORS settings
- Ensure backend is running

#### 3. Database Connection Issues
- Verify DATABASE_URL format
- Check database permissions
- Ensure database is accessible

#### 4. File Upload Issues
- Check AWS credentials
- Verify S3 bucket permissions
- Check file size limits

### Debug Commands
```bash
# Check build locally
npm run build

# Test backend connection
curl https://your-backend.railway.app/health

# Check environment variables
vercel env ls
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor performance metrics
- Track user behavior

### Railway Monitoring
- Check deployment logs
- Monitor resource usage
- Set up alerts

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage stats

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Frontend**: Auto-deploy on push to main
- **Backend**: Auto-deploy on push to main
- **Database**: Manual migrations

### Branch Strategy
- `main`: Production deployments
- `develop`: Staging deployments
- `feature/*`: Feature branches

## 🛡️ Security Checklist

- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Database credentials are protected
- [ ] AWS credentials have minimal permissions
- [ ] Clerk authentication is properly configured
- [ ] HTTPS is enabled everywhere
- [ ] API rate limiting is in place

## 📈 Performance Optimization

### Frontend
- Enable Vercel Edge Functions
- Use Next.js Image Optimization
- Implement proper caching
- Enable compression

### Backend
- Use connection pooling
- Implement caching
- Optimize database queries
- Use CDN for static assets

## 🔧 Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor error logs
- Check performance metrics
- Backup database regularly

### Scaling Considerations
- Monitor resource usage
- Set up auto-scaling
- Consider database read replicas
- Implement caching layers

## 📞 Support

If you encounter issues:
1. Check the logs in Vercel/Railway dashboards
2. Review this deployment guide
3. Check GitHub issues
4. Contact support

---

**Happy Deploying! 🚀**
