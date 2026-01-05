#!/usr/bin/env python3
"""
ATS Resume Parser using pyresparser
Extracts structured data from resume PDFs for ATS compatibility analysis
"""

import sys
import json
import os
from typing import Dict, Any

# Add detailed logging
import traceback
import time

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
        print(f"[DEBUG] Importing pyresparser...", file=sys.stderr)
        start_time = time.time()
        from pyresparser import ResumeParser
        import_time = time.time() - start_time
        print(f"[DEBUG] pyresparser imported in {import_time:.2f}s", file=sys.stderr)

        # Parse the resume
        print(f"[DEBUG] Calling ResumeParser.get_extracted_data()...", file=sys.stderr)
        parse_start = time.time()
        data = ResumeParser(pdf_path).get_extracted_data()
        parse_time = time.time() - parse_start
        print(f"[DEBUG] Resume parsed in {parse_time:.2f}s", file=sys.stderr)

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
        error_details = {
            'success': False,
            'error': f'pyresparser not installed: {str(e)}',
            'traceback': traceback.format_exc(),
            'fallback': True
        }
        print(json.dumps(error_details), file=sys.stderr)
        return error_details
    except Exception as e:
        error_details = {
            'success': False,
            'error': f'Error parsing resume: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'fallback': False
        }
        print(json.dumps(error_details), file=sys.stderr)
        return error_details


def main():
    """Main entry point for the script"""
    try:
        # Log startup
        print(f"[DEBUG] Script started with args: {sys.argv}", file=sys.stderr)
        print(f"[DEBUG] Python version: {sys.version}", file=sys.stderr)
        print(f"[DEBUG] Working directory: {os.getcwd()}", file=sys.stderr)

        if len(sys.argv) != 2:
            error = {
                'success': False,
                'error': 'Usage: python ats_parser.py <pdf_path>'
            }
            print(json.dumps(error))
            sys.exit(1)

        pdf_path = sys.argv[1]
        print(f"[DEBUG] PDF path: {pdf_path}", file=sys.stderr)

        # Check if file exists
        if not os.path.exists(pdf_path):
            error = {
                'success': False,
                'error': f'File not found: {pdf_path}'
            }
            print(json.dumps(error))
            sys.exit(1)

        file_size = os.path.getsize(pdf_path)
        print(f"[DEBUG] PDF file exists, size: {file_size} bytes", file=sys.stderr)

        # Parse the resume
        print(f"[DEBUG] Starting resume parsing...", file=sys.stderr)
        result = parse_resume(pdf_path)
        print(f"[DEBUG] Parsing completed. Success: {result.get('success')}", file=sys.stderr)

        # Output JSON result
        print(json.dumps(result, indent=2))

        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)

    except Exception as e:
        # Catch any uncaught exceptions
        error = {
            'success': False,
            'error': f'Uncaught exception in main: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error), file=sys.stderr)
        print(json.dumps(error))
        sys.exit(1)


if __name__ == '__main__':
    main()
