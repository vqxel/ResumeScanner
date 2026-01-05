import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';
import { analyzeResume } from '@/lib/claude';
import type { ATSData, AnalysisResult, ATSParserResult } from '@/types';

const execAsync = promisify(exec);

// Increase timeout for API route (10 seconds for Vercel free tier)
export const maxDuration = 10;

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get page count from PDF buffer
 */
async function getPDFPageCount(buffer: Buffer): Promise<number> {
  try {
    const data = await pdf(buffer);
    return data.numpages;
  } catch (error) {
    return 1; // Default to 1 if we can't determine
  }
}

/**
 * Run Python ATS parser on the PDF file (DISABLED for Vercel - use fast fallback instead)
 * To enable Python parsing, pass usePython=true parameter
 */
async function runATSParser(
  pdfBuffer: Buffer,
  resumeText: string,
  usePython: boolean = false
): Promise<ATSData> {
  if (!usePython) {
    // Use fast fallback for Vercel (saves 2-5 seconds)
    return createSmartFallbackATSData(resumeText);
  }

  // Original Python implementation (only runs if explicitly enabled)
  const tmpDir = join(process.cwd(), 'tmp');
  const tmpFilePath = join(tmpDir, `resume-${Date.now()}.pdf`);

  try {
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    await writeFile(tmpFilePath, pdfBuffer);

    const pythonScript = join(process.cwd(), 'scripts', 'ats_parser.py');
    const { stdout, stderr } = await execAsync(`python3 ${pythonScript} ${tmpFilePath}`, {
      timeout: 5000, // Reduced to 5 second timeout
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python script stderr:', stderr);
    }

    const result: ATSParserResult = JSON.parse(stdout);

    if (!result.success) {
      return createSmartFallbackATSData(resumeText);
    }

    return result.data!;

  } catch (error) {
    console.error('Error running ATS parser:', error);
    return createSmartFallbackATSData(resumeText);
  } finally {
    try {
      await unlink(tmpFilePath);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }
  }
}

/**
 * Create smart fallback ATS data using regex patterns (fast alternative to pyresparser)
 */
function createSmartFallbackATSData(text: string): ATSData {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  // Extract email
  const emails = text.match(emailRegex);
  const email = emails?.[0] || 'Not detected';

  // Extract phone
  const phones = text.match(phoneRegex);
  const mobile_number = phones?.[0] || 'Not detected';

  // Extract name (usually first line or near top)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const name = lines[0]?.trim() || 'Not detected';

  // Extract skills (look for skills section)
  const skills: string[] = [];
  const skillsMatch = text.match(/skills?:?\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    const commonSkills = skillsText.match(/\b(?:JavaScript|TypeScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Git|HTML|CSS|C\+\+|Ruby|Go|Rust|Swift|Kotlin|PHP|R|Scala|MongoDB|PostgreSQL|Redis|Kubernetes|GraphQL|REST|API|Linux|Bash|Shell|Jenkins|CI\/CD|Agile|Scrum|TDD|OOP|Machine Learning|AI|Data Science|Analytics|Excel|Tableau|Power BI|Salesforce|SAP|Oracle|\.NET|Angular|Vue|Django|Flask|Spring|Laravel|Express|FastAPI|Pandas|NumPy|TensorFlow|PyTorch|Scikit-learn|Spark|Hadoop|Kafka|RabbitMQ|Elasticsearch|Nginx|Apache|Azure|GCP|CloudFormation|Terraform|Ansible|Puppet|Chef|Prometheus|Grafana|Datadog|Splunk|New Relic|Selenium|Cypress|Jest|Mocha|JUnit|TestNG|Postman|Swagger|OAuth|JWT|SAML|LDAP|Active Directory|Networking|Security|Penetration Testing|Ethical Hacking|OWASP|CISSP|CEH|CompTIA|ITIL|PMP|Six Sigma|Lean)\b/gi);
    if (commonSkills) {
      skills.push(...[...new Set(commonSkills)].slice(0, 15));
    }
  }

  // Extract education
  const education: string[] = [];
  const degree: string[] = [];
  const eduMatch = text.match(/education:?\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
  if (eduMatch) {
    const eduText = eduMatch[1];
    const universities = eduText.match(/\b(?:University|College|Institute|School)\s+(?:of\s+)?[\w\s]+/gi);
    if (universities) {
      education.push(...universities.slice(0, 3));
    }
    const degrees = eduText.match(/\b(?:PhD|Ph\.D|Doctor|Master|M\.S\.|MS|M\.A\.|MA|MBA|Bachelor|B\.S\.|BS|B\.A\.|BA|Associate|A\.S\.|AS|A\.A\.|AA)\b[^,\n]*/gi);
    if (degrees) {
      degree.push(...degrees.slice(0, 3));
    }
  }

  // Extract experience
  const designation: string[] = [];
  const company_names: string[] = [];
  const expMatch = text.match(/(?:experience|work history|employment):?\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
  if (expMatch) {
    const expText = expMatch[1];
    const titles = expText.match(/\b(?:Senior|Junior|Lead|Principal|Staff|Chief|Head of|Director|Manager|Engineer|Developer|Designer|Analyst|Architect|Consultant|Specialist|Coordinator|Administrator|Technician|Scientist|Researcher)\s+[\w\s]+/gi);
    if (titles) {
      designation.push(...titles.slice(0, 5));
    }
  }

  return {
    name,
    email,
    mobile_number,
    skills,
    education,
    degree,
    designation,
    experience: [],
    company_names,
    no_of_pages: 1,
    total_experience: 0,
  };
}

/**
 * Create fallback ATS data when pyresparser is not available (legacy)
 */
function createFallbackATSData(): ATSData {
  return {
    name: 'Not detected',
    email: 'Not detected',
    mobile_number: 'Not detected',
    skills: [],
    education: [],
    degree: [],
    designation: [],
    experience: [],
    company_names: [],
    no_of_pages: 1,
    total_experience: 0,
  };
}

/**
 * Validate required sections in resume text
 */
function validateRequiredSections(text: string): string[] {
  const missing: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for Education section
  if (!lowerText.includes('education') && !lowerText.includes('academic')) {
    missing.push('Education');
  }

  // Check for Experience section
  if (!lowerText.includes('experience') && !lowerText.includes('work history') && !lowerText.includes('employment')) {
    missing.push('Work Experience');
  }

  // Check for Skills section
  if (!lowerText.includes('skills') && !lowerText.includes('technical skills') && !lowerText.includes('competencies')) {
    missing.push('Skills');
  }

  return missing;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Get user preferences from form data
    const usePythonATS = formData.get('usePythonATS') === 'true';
    const useClaudeAPI = formData.get('useClaudeAPI') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text and page count in parallel
    const [rawText, pageCount] = await Promise.all([
      extractTextFromPDF(buffer),
      getPDFPageCount(buffer),
    ]);

    // Check page count
    const criticalIssues: string[] = [];
    if (pageCount > 1) {
      criticalIssues.push(`Resume is ${pageCount} pages long. Best practice is to keep it to 1 page.`);
    }

    // Validate required sections
    const missingRequiredSections = validateRequiredSections(rawText);
    if (missingRequiredSections.length > 0) {
      criticalIssues.push(`Missing required sections: ${missingRequiredSections.join(', ')}`);
    }

    // Run ATS parser and Claude analysis in parallel (saves time!)
    const [atsData, analysis] = await Promise.all([
      runATSParser(buffer, rawText, usePythonATS),
      analyzeResume(rawText, useClaudeAPI),
    ]);

    // Combine results
    const result: AnalysisResult = {
      grades: analysis.grades,
      atsData,
      rawText,
      pageCount,
      criticalIssues: [...criticalIssues, ...analysis.criticalIssues],
      missingRequiredSections: analysis.missingRequiredSections,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze resume',
      },
      { status: 500 }
    );
  }
}
