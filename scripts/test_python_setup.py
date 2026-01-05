#!/usr/bin/env python3
"""
Diagnostic script to test Python environment setup on Render
"""

import sys
import json

def test_python_setup():
    """Test all Python dependencies and configuration"""
    results = {
        'python_version': sys.version,
        'python_executable': sys.executable,
        'tests': {}
    }

    # Test 1: Import pyresparser
    try:
        import pyresparser
        results['tests']['pyresparser'] = {
            'status': 'OK',
            'version': getattr(pyresparser, '__version__', 'unknown')
        }
    except Exception as e:
        results['tests']['pyresparser'] = {
            'status': 'FAILED',
            'error': str(e)
        }

    # Test 2: Import spacy
    try:
        import spacy
        results['tests']['spacy'] = {
            'status': 'OK',
            'version': spacy.__version__
        }
    except Exception as e:
        results['tests']['spacy'] = {
            'status': 'FAILED',
            'error': str(e)
        }

    # Test 3: Load spaCy model
    try:
        import spacy
        nlp = spacy.load('en_core_web_sm')
        results['tests']['spacy_model'] = {
            'status': 'OK',
            'model': 'en_core_web_sm'
        }
    except Exception as e:
        results['tests']['spacy_model'] = {
            'status': 'FAILED',
            'error': str(e)
        }

    # Test 4: Check file paths
    import os
    results['tests']['file_access'] = {
        'status': 'OK',
        'script_dir': os.path.dirname(os.path.abspath(__file__)),
        'cwd': os.getcwd(),
        'tmp_writable': os.access('/tmp', os.W_OK)
    }

    return results

if __name__ == '__main__':
    results = test_python_setup()
    print(json.dumps(results, indent=2))

    # Exit with error code if any test failed
    failed_tests = [k for k, v in results['tests'].items()
                    if isinstance(v, dict) and v.get('status') == 'FAILED']

    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}", file=sys.stderr)
        sys.exit(1)
    else:
        print("\n✅ All tests passed!", file=sys.stderr)
        sys.exit(0)
