#!/bin/bash
# Render Build Script for Resume Analyzer

set -e  # Exit on error

echo "📦 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "📥 Downloading spaCy language model..."
python3 -m spacy download en_core_web_sm

echo "🧪 Testing Python setup..."
python3 scripts/test_python_setup.py

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "Python version: $(python3 --version)"
echo "Node version: $(node --version)"
echo "Next.js build successful!"
