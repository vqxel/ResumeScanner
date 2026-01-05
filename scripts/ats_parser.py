#!/usr/bin/env python3
"""
ATS Resume Parser using pyresparser
Extracts structured data from resume PDFs for ATS compatibility analysis
"""

import sys
import json
import os
from typing import Dict, Any

def parse_resume(pdf_path: str) -> Dict[str, Any]:
    """
    Parse resume using pyresparser and return structured data

    Args:
        pdf_path: Path to the PDF resume file

    Returns:
        Dictionary containing parsed resume data
    """
    try:
        # Import pyresparser (lazy import to allow script to fail gracefully)
        from pyresparser import ResumeParser

        # Parse the resume
        data = ResumeParser(pdf_path).get_extracted_data()

        # Clean and structure the data
        structured_data = {
            'name': data.get('name', 'Not detected'),
            'email': data.get('email', 'Not detected'),
            'mobile_number': data.get('mobile_number', 'Not detected'),
            'skills': data.get('skills', []),
            'education': data.get('college_name', []) if isinstance(data.get('college_name'), list) else [data.get('college_name', 'Not detected')],
            'degree': data.get('degree', []),
            'designation': data.get('designation', []),
            'experience': data.get('experience', []),
            'company_names': data.get('company_names', []),
            'no_of_pages': data.get('no_of_pages', 1),
            'total_experience': data.get('total_experience', 0),
        }

        return {
            'success': True,
            'data': structured_data
        }

    except ImportError as e:
        return {
            'success': False,
            'error': f'pyresparser not installed: {str(e)}',
            'fallback': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error parsing resume: {str(e)}',
            'fallback': False
        }


def main():
    """Main entry point for the script"""
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ats_parser.py <pdf_path>'
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]

    # Check if file exists
    if not os.path.exists(pdf_path):
        print(json.dumps({
            'success': False,
            'error': f'File not found: {pdf_path}'
        }))
        sys.exit(1)

    # Parse the resume
    result = parse_resume(pdf_path)

    # Output JSON result
    print(json.dumps(result, indent=2))

    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)


if __name__ == '__main__':
    main()
