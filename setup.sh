#!/bin/bash

# Resume Analyzer Setup Script
# This script helps you set up the development environment

echo "🚀 Resume Analyzer Setup"
echo "========================"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo "✓ Node.js $NODE_VERSION found"
else
    echo "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Python
echo ""
echo "Checking Python installation..."
if command -v python3 &> /dev/null
then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ $PYTHON_VERSION found"
else
    echo "⚠ Python3 not found. Python is optional but recommended for full ATS functionality."
fi

# Install Node dependencies
echo ""
echo "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Node.js dependencies installed"
else
    echo "✗ Failed to install Node.js dependencies"
    exit 1
fi

# Install Python dependencies (optional)
echo ""
echo "Do you want to install Python dependencies for full ATS parsing? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt

    if [ $? -eq 0 ]; then
        echo "✓ Python dependencies installed"

        echo "Downloading spaCy model..."
        python3 -m spacy download en_core_web_sm

        if [ $? -eq 0 ]; then
            echo "✓ spaCy model downloaded"
        else
            echo "⚠ Failed to download spaCy model. You can try manually: python3 -m spacy download en_core_web_sm"
        fi
    else
        echo "⚠ Failed to install Python dependencies. App will use fallback ATS data."
    fi
else
    echo "⚠ Skipping Python dependencies. App will use fallback ATS data."
fi

# Create .env.local if it doesn't exist
echo ""
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
    echo "✓ .env.local created"
    echo ""
    echo "⚠ IMPORTANT: Edit .env.local and add your Anthropic API key!"
    echo "   Get your key from: https://console.anthropic.com/"
else
    echo "✓ .env.local already exists"
fi

echo ""
echo "========================"
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your ANTHROPIC_API_KEY"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
