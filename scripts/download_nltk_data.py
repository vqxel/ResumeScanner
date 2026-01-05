#!/usr/bin/env python3
"""
Download required NLTK data for pyresparser
"""

import nltk
import sys

def download_nltk_data():
    """Download all NLTK data required by pyresparser"""

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
            nltk.download(package, quiet=True)
            print(f"  ✅ {package} downloaded successfully")
        except Exception as e:
            print(f"  ❌ Failed to download {package}: {e}")
            failed_packages.append(package)

    if failed_packages:
        print(f"\n❌ Failed to download: {', '.join(failed_packages)}")
        sys.exit(1)
    else:
        print("\n✅ All NLTK data packages downloaded successfully!")
        sys.exit(0)

if __name__ == '__main__':
    download_nltk_data()
