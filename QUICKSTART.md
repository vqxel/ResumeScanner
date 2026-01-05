# Quick Start Guide

Get up and running with Resume Analyzer in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Python 3+ (optional, for full ATS features)

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh

# Edit .env.local and add your API key
nano .env.local

# Start the dev server
npm run dev
```

### Option 2: Manual Setup

```bash
# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local and add your ANTHROPIC_API_KEY
nano .env.local

# (Optional) Install Python dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Start development server
npm run dev
```

## Usage

1. Open [http://localhost:3000](http://localhost:3000)
2. Upload a PDF resume
3. Wait for analysis (10-30 seconds)
4. Review feedback across 7 dimensions
5. Download results as text file

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add your API key
vercel env add ANTHROPIC_API_KEY

# Deploy to production
vercel --prod
```

Or use the Vercel dashboard:
1. Import from GitHub
2. Add `ANTHROPIC_API_KEY` environment variable
3. Deploy!

## Common Issues

### "pyresparser not available"
- **Solution**: Install Python deps: `pip install -r requirements.txt`
- **Alternative**: App works without it, using fallback data

### "Failed to analyze resume"
- **Check**: Is your API key correct in `.env.local`?
- **Check**: Do you have API credits at console.anthropic.com?

### PDF not loading
- **Try**: A different PDF file
- **Check**: File size is under 10MB
- **Ensure**: File is a valid PDF

## Tips

- Best results with 1-page resumes
- Include Education, Experience, and Skills sections
- Specify your major/field of study in Education
- Use standard section headers

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review the troubleshooting section
- Open an issue on GitHub

---

Happy analyzing! 🚀
