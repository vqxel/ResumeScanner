#!/usr/bin/env python3
"""
Simple ATS Resume Parser using spaCy and pdfminer
More reliable alternative to pyresparser
"""

import sys
import json
import os
import re
from typing import Dict, Any, List
import traceback
import time

# Configure NLTK data path
import nltk
nltk_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nltk_data')
if os.path.exists(nltk_data_dir) and nltk_data_dir not in nltk.data.path:
    nltk.data.path.insert(0, nltk_data_dir)
    print(f"[DEBUG] Added NLTK data path: {nltk_data_dir}", file=sys.stderr)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using pdfminer"""
    from pdfminer.high_level import extract_text
    return extract_text(pdf_path)

def parse_resume(pdf_path: str) -> Dict[str, Any]:
    """
    Parse resume using spaCy and regex patterns

    Args:
        pdf_path: Path to the PDF resume file

    Returns:
        Dictionary containing parsed resume data
    """
    try:
        print(f"[DEBUG] Loading spaCy model...", file=sys.stderr)
        start_time = time.time()
        import spacy
        nlp = spacy.load('en_core_web_sm')
        load_time = time.time() - start_time
        print(f"[DEBUG] spaCy model loaded in {load_time:.2f}s", file=sys.stderr)

        # Extract text from PDF
        print(f"[DEBUG] Extracting text from PDF...", file=sys.stderr)
        extract_start = time.time()
        text = extract_text_from_pdf(pdf_path)
        extract_time = time.time() - extract_start
        print(f"[DEBUG] Text extracted in {extract_time:.2f}s ({len(text)} chars)", file=sys.stderr)

        # Process with spaCy
        print(f"[DEBUG] Processing text with spaCy...", file=sys.stderr)
        parse_start = time.time()
        doc = nlp(text[:10000])  # Limit to first 10k chars for performance
        parse_time = time.time() - parse_start
        print(f"[DEBUG] Text processed in {parse_time:.2f}s", file=sys.stderr)

        # Extract information
        name = extract_name(doc, text)
        email = extract_email(text)
        phone = extract_phone(text)
        skills = extract_skills(text, doc)
        education = extract_education(text, doc)
        experience = extract_experience(text, doc)

        structured_data = {
            'name': name,
            'email': email,
            'mobile_number': phone,
            'skills': skills,
            'education': education,
            'degree': extract_degrees(text),
            'designation': extract_designations(doc),
            'experience': experience,
            'company_names': extract_companies(text, doc),
            'no_of_pages': text.count('\x0c') + 1,  # Form feed character indicates page break
            'total_experience': estimate_years_experience(text),
        }

        return {
            'success': True,
            'data': structured_data
        }

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

def extract_name(doc, text: str) -> str:
    """Extract candidate name from resume"""
    # Try to find name using spaCy NER
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            return ent.text

    # Fallback: use first line
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        return lines[0]

    return 'Not detected'

def extract_email(text: str) -> str:
    """Extract email address"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else 'Not detected'

def extract_phone(text: str) -> str:
    """Extract phone number"""
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    match = re.search(phone_pattern, text)
    return match.group(0) if match else 'Not detected'

def extract_skills(text: str, doc) -> List[str]:
    """Extract technical skills"""
    skills_keywords = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
        'PHP', 'R', 'Scala', 'Perl', 'Shell', 'Bash', 'PowerShell',
        'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 'Spring', 'Laravel', 'Express',
        'FastAPI', 'Next.js', 'Nuxt', 'Svelte',
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Oracle', 'SQLite',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD', 'Terraform', 'Ansible',
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        'HTML', 'CSS', 'REST', 'GraphQL', 'API', 'Microservices', 'Agile', 'Scrum', 'DevOps',
        'Linux', 'Unix', 'Windows', 'macOS',
        'Verilog', 'VHDL', 'FPGA', 'VLSI', 'ASIC', 'RTL', 'Embedded', 'Firmware', 'PCB',
    ]

    found_skills = []
    text_lower = text.lower()

    for skill in skills_keywords:
        if skill.lower() in text_lower:
            # Check if it appears in a skills section or job description
            found_skills.append(skill)

    return list(set(found_skills))[:25]  # Return unique skills, max 25

def extract_education(text: str, doc) -> List[str]:
    """Extract educational institutions"""
    institutions = []

    # Look for common education keywords
    edu_keywords = ['university', 'college', 'institute', 'school']

    for ent in doc.ents:
        if ent.label_ == 'ORG':
            ent_lower = ent.text.lower()
            if any(keyword in ent_lower for keyword in edu_keywords):
                institutions.append(ent.text)

    return institutions[:5] if institutions else ['Not detected']

def extract_degrees(text: str) -> List[str]:
    """Extract degree information"""
    degree_patterns = [
        r'\b(B\.?S\.?|Bachelor|B\.?A\.?|B\.?E\.?|B\.?Tech\.?)\s+(?:in|of)?\s+[\w\s]+',
        r'\b(M\.?S\.?|Master|M\.?A\.?|M\.?E\.?|M\.?Tech\.?|MBA)\s+(?:in|of)?\s+[\w\s]+',
        r'\b(Ph\.?D\.?|Doctorate)\s+(?:in|of)?\s+[\w\s]+',
    ]

    degrees = []
    for pattern in degree_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        degrees.extend([m if isinstance(m, str) else m[0] for m in matches])

    return degrees[:5] if degrees else ['Not detected']

def extract_designations(doc) -> List[str]:
    """Extract job titles/designations"""
    job_titles = []

    # Common job title keywords
    title_keywords = [
        'engineer', 'developer', 'manager', 'director', 'analyst', 'consultant',
        'architect', 'designer', 'scientist', 'researcher', 'lead', 'senior',
        'junior', 'principal', 'staff', 'intern', 'associate'
    ]

    for ent in doc.ents:
        if ent.label_ in ['PERSON', 'ORG']:
            continue
        ent_lower = ent.text.lower()
        if any(keyword in ent_lower for keyword in title_keywords):
            job_titles.append(ent.text)

    return job_titles[:5] if job_titles else []

def extract_companies(text: str, doc) -> List[str]:
    """Extract company names"""
    companies = []

    # Skip educational institutions
    edu_keywords = ['university', 'college', 'institute', 'school']

    for ent in doc.ents:
        if ent.label_ == 'ORG':
            ent_lower = ent.text.lower()
            if not any(keyword in ent_lower for keyword in edu_keywords):
                companies.append(ent.text)

    return companies[:10] if companies else []

def extract_experience(text: str, doc) -> List[str]:
    """Extract work experience descriptions"""
    experiences = []

    # Find experience section
    exp_match = re.search(
        r'(?:experience|employment|work history)[:\s]*\n([\s\S]*?)(?=\n(?:education|skills|projects|certifications|$))',
        text,
        re.IGNORECASE
    )

    if exp_match:
        exp_text = exp_match.group(1)
        # Split by common delimiters
        exp_items = re.split(r'\n(?=[A-Z])', exp_text)
        experiences = [e.strip() for e in exp_items if len(e.strip()) > 20][:5]

    return experiences

def estimate_years_experience(text: str) -> float:
    """Estimate total years of experience"""
    # Look for year ranges like "2018-2020" or "2018 - Present"
    year_pattern = r'(19|20)\d{2}\s*[-–]\s*(?:(19|20)\d{2}|present|current)'
    matches = re.findall(year_pattern, text, re.IGNORECASE)

    if matches:
        return len(matches) * 2  # Rough estimate: 2 years per job

    return 0.0

def main():
    """Main entry point"""
    try:
        print(f"[DEBUG] Script started with args: {sys.argv}", file=sys.stderr)
        print(f"[DEBUG] Python version: {sys.version}", file=sys.stderr)

        if len(sys.argv) != 2:
            error = {'success': False, 'error': 'Usage: python ats_parser_spacy.py <pdf_path>'}
            print(json.dumps(error))
            sys.exit(1)

        pdf_path = sys.argv[1]
        print(f"[DEBUG] PDF path: {pdf_path}", file=sys.stderr)

        if not os.path.exists(pdf_path):
            error = {'success': False, 'error': f'File not found: {pdf_path}'}
            print(json.dumps(error))
            sys.exit(1)

        file_size = os.path.getsize(pdf_path)
        print(f"[DEBUG] PDF file exists, size: {file_size} bytes", file=sys.stderr)

        # Parse resume
        print(f"[DEBUG] Starting resume parsing...", file=sys.stderr)
        total_start = time.time()
        result = parse_resume(pdf_path)
        total_time = time.time() - total_start

        print(f"[DEBUG] Parsing completed in {total_time:.2f}s. Success: {result.get('success')}", file=sys.stderr)

        # Output result
        print(json.dumps(result, indent=2))
        sys.exit(0 if result['success'] else 1)

    except Exception as e:
        error = {
            'success': False,
            'error': f'Uncaught exception: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error), file=sys.stderr)
        print(json.dumps(error))
        sys.exit(1)

if __name__ == '__main__':
    main()
