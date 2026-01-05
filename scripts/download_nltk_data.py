#!/usr/bin/env python3
"""
Download required NLTK data for pyresparser
"""

import nltk
import sys
import os

def download_nltk_data():
    """Download all NLTK data required by pyresparser"""

    # Set NLTK data path to project directory (persists between build and runtime on Render)
    # Use the virtualenv's lib directory which is accessible at runtime
    nltk_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nltk_data')
    os.makedirs(nltk_data_dir, exist_ok=True)

    # Add to NLTK's search path
    if nltk_data_dir not in nltk.data.path:
        nltk.data.path.insert(0, nltk_data_dir)

    print(f"📍 NLTK data directory: {nltk_data_dir}")

    # List of required NLTK data packages for pyresparser
    required_packages = [
        'stopwords',           # Word filtering
        'punkt',               # Sentence tokenization
        'averaged_perceptron_tagger',  # POS tagging
        'maxent_ne_chunker',   # Named entity recognition
        'words',               # Word corpus
        'wordnet',             # Lexical database
    ]

    print("📥 Downloading NLTK data packages...")

    failed_packages = []

    for package in required_packages:
        try:
            print(f"  ⬇️  Downloading {package}...")
            nltk.download(package, download_dir=nltk_data_dir, quiet=True)
            print(f"  ✅ {package} downloaded successfully")
        except Exception as e:
            print(f"  ❌ Failed to download {package}: {e}")
            failed_packages.append(package)

    if failed_packages:
        print(f"\n❌ Failed to download: {', '.join(failed_packages)}")
        sys.exit(1)
    else:
        print("\n✅ All NLTK data packages downloaded successfully!")
        print(f"📍 Data saved to: {nltk_data_dir}")
        sys.exit(0)

if __name__ == '__main__':
    download_nltk_data()
