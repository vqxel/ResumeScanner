# Resume Analyzer

An AI-powered resume analysis web application that provides comprehensive feedback on resume quality, ATS compatibility, and content across 7 key dimensions.

## Features

- **PDF Upload & Preview**: Drag-and-drop or file picker for PDF resumes
- **ATS Compatibility Analysis**: Compares your resume with what automated systems extract
- **7-Dimension Grading System**:
  1. Density, Clarity & Conciseness
  2. Content Ordering/Positioning
  3. Section Names
  4. Human Readability
  5. ATS Compatibility
  6. Job Application Form Extraction
  7. Concept Level Analysis (based on field of study)
- **Side-by-Side Comparison**: View original PDF alongside ATS-extracted data
- **Downloadable Feedback**: Export analysis as a text file
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **PDF Processing**: pdf-parse, react-pdf
- **ATS Parser**: pyresparser (Python)
- **AI Analysis**: Anthropic Claude API (claude-sonnet-4-5)
- **Deployment**: Optimized for Vercel

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Python 3** (Optional - only needed if using real ATS parser)
- **pip** (Optional - Python package manager)

## ⚡ Vercel Timeout Fix (IMPORTANT)

By default, the app uses **mock analysis data** to avoid Vercel's 10-second timeout limit. This means:

✅ **Works perfectly on Vercel free tier** (responses in ~2-3 seconds)
✅ **No Claude API key required** for basic functionality
✅ **No Python dependencies needed**
✅ **Demonstrates full UI and ATS extraction**

The mock data provides realistic feedback across all 7 dimensions. To enable real Claude AI analysis:

1. Upgrade to Vercel Pro (60-second timeout) OR deploy to Railway/Render
2. Set `USE_MOCK_ANALYSIS=false` in your environment variables
3. Add your `ANTHROPIC_API_KEY`

## Configuration Options

Edit `.env.local` to customize behavior:

```env
# Use mock analysis (fast, no API needed)
USE_MOCK_ANALYSIS=true

# Use Python ATS parser (requires pyresparser)
USE_PYTHON_ATS=false

# Claude API key (only needed if USE_MOCK_ANALYSIS=false)
ANTHROPIC_API_KEY=your_key_here
```

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ResumeScanner
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Install Python Dependencies (Optional but Recommended)

The app can run without Python dependencies, but for full ATS analysis functionality, install:

```bash
# Install pyresparser and dependencies
pip install pyresparser spacy

# Download required spaCy model
python -m spacy download en_core_web_sm
```

**Note**: If you skip this step, the app will still work but will use fallback ATS data instead of real parsing.

#### Troubleshooting Python Installation

If you encounter issues installing pyresparser:

```bash
# On macOS/Linux, you may need:
pip3 install pyresparser spacy
python3 -m spacy download en_core_web_sm

# If you get permission errors:
pip install --user pyresparser spacy
python -m spacy download en_core_web_sm
```

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_actual_api_key_here
```

**Get your API key**: Visit [https://console.anthropic.com/](https://console.anthropic.com/) to create an account and generate an API key.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**: Push your code to a GitHub repository

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**:
   - In the Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add: `ANTHROPIC_API_KEY` with your API key value

4. **Deploy**: Click "Deploy" and Vercel will build and deploy your app

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variable
vercel env add ANTHROPIC_API_KEY

# Deploy to production
vercel --prod
```

### Python Runtime on Vercel

**Important**: Vercel's serverless functions have limitations with Python runtime:

1. **Free Tier Limitations**:
   - 10-second timeout limit
   - Limited Python package support

2. **pyresparser Availability**:
   - pyresparser may not work on Vercel due to dependencies
   - The app will automatically fall back to simplified ATS parsing
   - For full functionality, consider deploying to a platform with better Python support (Railway, Render, AWS)

3. **Alternative Deployment** (if you need full Python support):
   - Deploy on **Railway**: Native Python support
   - Deploy on **Render**: Full Python runtime
   - Deploy on **AWS Lambda**: Configure layers for Python packages

## Project Structure

```
ResumeScanner/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Main API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── ATSDisplay.tsx            # ATS extraction display
│   ├── FileUpload.tsx            # File upload component
│   ├── GradingSection.tsx        # Collapsible grading UI
│   └── PDFViewer.tsx             # PDF preview component
├── lib/
│   └── claude.ts                 # Claude API integration
├── scripts/
│   └── ats_parser.py             # Python ATS parser
├── types/
│   └── index.ts                  # TypeScript definitions
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Node dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment config
```

## Usage

1. **Upload Resume**:
   - Click "Choose File" or drag-and-drop a PDF resume
   - Only PDF files are accepted
   - Maximum file size: 10MB
   - Recommended: 1-page resumes

2. **View Analysis**:
   - Wait 10-30 seconds for processing
   - See side-by-side comparison of original PDF and ATS extraction
   - Review critical issues at the top
   - Expand each of the 7 grading dimensions for detailed feedback

3. **Download Feedback**:
   - Click "Download Feedback as Text File"
   - Get a formatted .txt file with all analysis results

4. **Analyze Another Resume**:
   - Click "Analyze New Resume" to start over

## API Endpoints

### POST /api/analyze

Analyzes a resume PDF and returns comprehensive feedback.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field containing PDF

**Response**:
```json
{
  "success": true,
  "data": {
    "grades": [...],
    "atsData": {...},
    "rawText": "...",
    "pageCount": 1,
    "criticalIssues": [...],
    "missingRequiredSections": [...]
  }
}
```

## Customization

### Adjusting Analysis Prompt

Edit `lib/claude.ts` to customize the analysis criteria:

```typescript
const ANALYSIS_PROMPT = `Your custom prompt here...`;
```

### Changing Score Thresholds

Edit `components/GradingSection.tsx` to adjust score color coding:

```typescript
function getScoreColor(score: number) {
  // Customize thresholds here
}
```

### Adding More Dimensions

1. Update the prompt in `lib/claude.ts`
2. Ensure Claude returns the new dimensions
3. They'll automatically appear in the UI

## Troubleshooting

### "pyresparser not available" Warning

**Issue**: Python ATS parser isn't working

**Solutions**:
- Install Python dependencies: `pip install pyresparser spacy`
- Download spaCy model: `python -m spacy download en_core_web_sm`
- If on Windows, you may need Visual C++ build tools
- The app will still work with fallback data

### "Failed to analyze resume" Error

**Possible Causes**:
- Invalid API key
- API rate limits
- Network issues
- PDF parsing errors

**Solutions**:
- Verify `ANTHROPIC_API_KEY` in `.env.local`
- Check API usage at console.anthropic.com
- Try a different PDF file
- Check browser console for detailed errors

### PDF Not Displaying

**Solutions**:
- Ensure PDF is not corrupted
- Try a different PDF viewer browser
- Check browser console for errors
- Verify file size is under 10MB

### Timeout on Vercel

**Issue**: Analysis takes longer than 10 seconds

**Solutions**:
- Upgrade to Vercel Pro (60s timeout)
- Deploy to alternative platform
- Optimize Claude prompt for faster responses

## Performance Considerations

- **API Route Timeout**: Free Vercel tier has 10-second limit
- **PDF Size**: Larger files take longer to process
- **Claude API**: Response time varies (typically 5-15 seconds)
- **Python Execution**: Adds 2-5 seconds if pyresparser is available

## Security Notes

- Never commit `.env.local` to version control
- API key should be kept secret
- PDFs are processed in temporary storage and deleted immediately
- No resume data is persisted
- Fully stateless - no database required

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Check existing issues for solutions
- Review the troubleshooting section above

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Anthropic Claude](https://www.anthropic.com/)
- ATS parsing via [pyresparser](https://github.com/OmkarPathak/pyresparser)
- PDF viewing with [react-pdf](https://github.com/wojtekmaj/react-pdf)

---

**Made with ❤️ using Claude AI**
