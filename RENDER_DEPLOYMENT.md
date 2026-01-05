# Deploying Resume Analyzer to Render

This guide walks you through deploying the Resume Analyzer to Render.com, which supports Python runtime and allows the full Python ATS parser to work.

## Why Render?

- ✅ **Full Python Support**: Unlike Vercel, Render supports Python 3 runtime
- ✅ **Longer Timeouts**: 60-second timeout (vs Vercel's 10 seconds)
- ✅ **Free Tier Available**: Free tier includes 750 hours/month
- ✅ **Easy Deployment**: Direct GitHub integration

## Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Anthropic API Key**: Get one from https://console.anthropic.com/
3. **Render Account**: Create a free account at https://render.com

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

Make sure all your latest changes are committed and pushed:

```bash
git add .
git commit -m "feat: Prepare for Render deployment"
git push origin claude/resume-analyzer-app-tOmk6
```

### 2. Create a Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easier integration)
4. Verify your email address

### 3. Create a New Web Service

1. **Click "New +" button** in the Render dashboard
2. **Select "Web Service"**
3. **Connect Your Repository**:
   - If this is your first time, click "Connect account" to authorize GitHub
   - Find your repository in the list
   - Click "Connect"

### 4. Configure Your Web Service

Fill in the deployment settings:

**Basic Settings**:
- **Name**: `resume-analyzer` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
- **Branch**: `claude/resume-analyzer-app-tOmk6` (or your main branch)
- **Root Directory**: Leave blank (or `.` if prompted)

**Build & Deploy Settings**:
- **Runtime**: `Node`
- **Build Command**: `bash build.sh`
- **Start Command**: `npm start`

**Plan**:
- Select **Free** tier (750 hours/month, sleeps after 15 min of inactivity)
- Or choose **Starter** ($7/month) for always-on service

### 5. Add Environment Variables

Click "Advanced" or scroll down to "Environment Variables" section:

Add these variables:

```
ANTHROPIC_API_KEY = your_actual_api_key_here
USE_MOCK_ANALYSIS = false
USE_PYTHON_ATS = true
NODE_ENV = production
```

**Important**: Replace `your_actual_api_key_here` with your real Anthropic API key.

### 6. Deploy

1. Click **"Create Web Service"**
2. Render will start building your application
3. Watch the build logs in real-time

**Build Process** (takes ~5-10 minutes):
- ✅ Installing Node.js dependencies
- ✅ Installing Python dependencies (pyresparser, spacy)
- ✅ Downloading spaCy language model (en_core_web_sm)
- ✅ Building Next.js application
- ✅ Starting the server

### 7. Access Your Application

Once deployment succeeds:
- Your app will be live at: `https://resume-analyzer-xxxx.onrender.com`
- Copy the URL from the dashboard
- Visit it in your browser

## Testing Python ATS Parser

1. **Upload a resume PDF**
2. **Enable "Use Python ATS Parser" toggle** (should be on by default)
3. **Click "Analyze Resume"**
4. **Check the status badge** - should show "🐍 Python ATS" in green
5. **Verify extraction quality** - should be much better than regex

## Configuration Options

You can adjust behavior via environment variables in Render dashboard:

### Use Real Claude AI Analysis
```
USE_MOCK_ANALYSIS = false
```
Set to `true` to use fast mock data (good for demos).

### Enable Python ATS Parser
```
USE_PYTHON_ATS = true
```
Set to `false` to fall back to regex-based extraction.

## Troubleshooting

### Build Fails During Python Installation

**Issue**: `error: externally-managed-environment`

**Solution**: The build.sh script should handle this, but if it fails, update build.sh:
```bash
pip install --break-system-packages -r requirements.txt
```

### spaCy Model Not Found

**Issue**: `Can't find model 'en_core_web_sm'`

**Solution**: Ensure build.sh includes:
```bash
python -m spacy download en_core_web_sm
```

### Application Timeout

**Issue**: Analysis takes longer than expected

**Solutions**:
- Upgrade to Starter plan ($7/month) for better performance
- Check API key is valid
- Monitor Render logs for errors

### Python Parser Still Not Working

**Check the logs**:
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for `[ATS]` prefixed messages
5. Verify you see: `[ATS] Successfully used Python parser!`

If you see fallback to regex:
- Check environment variable `USE_PYTHON_ATS=true` is set
- Verify Python dependencies installed during build
- Check build logs for any Python errors

## Monitoring and Logs

**View Real-time Logs**:
1. Render Dashboard → Your Service → Logs
2. Watch for `[ATS]` prefixed messages
3. Monitor API response times

**Check Build Logs**:
1. Render Dashboard → Your Service → Events
2. Click on latest deployment
3. View complete build output

## Updating Your Application

When you push changes to GitHub:

**Automatic Deployment** (default):
- Render automatically rebuilds and deploys
- Takes ~5-10 minutes
- Zero downtime deployment

**Manual Deployment**:
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

## Cost Considerations

**Free Tier**:
- 750 hours/month of runtime
- Sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Good for: demos, testing, low-traffic apps

**Starter Tier ($7/month)**:
- Always-on (no sleep)
- Instant response times
- Better performance
- Good for: production apps

## Comparing Vercel vs Render

| Feature | Vercel (Free) | Render (Free) |
|---------|---------------|---------------|
| Python Support | ❌ No | ✅ Yes |
| Timeout | 10 seconds | 60 seconds |
| ATS Parser | Regex only | Python (pyresparser) |
| Claude API | Mock only | Real API works |
| Cold Start | ~1 second | ~30 seconds |
| Always On | Yes | No (sleeps) |
| Best For | Fast demos | Full functionality |

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test Python ATS parser with real resumes
3. ✅ Enable Claude API for AI analysis
4. ✅ Monitor performance and costs
5. Consider upgrading to Starter tier for production use

## Support

If you encounter issues:
- Check Render logs for detailed error messages
- Review the troubleshooting section above
- Render has excellent documentation at https://render.com/docs
- Their support is responsive even on free tier

---

**Ready to deploy?** Follow the steps above and you'll have full Python ATS functionality in ~10 minutes!
