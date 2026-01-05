#!/bin/bash
# Render Build Script for Resume Analyzer

echo "📦 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "📥 Downloading spaCy language model..."
python -m spacy download en_core_web_sm

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build complete!"
