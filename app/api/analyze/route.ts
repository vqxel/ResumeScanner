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
 * Run Python ATS parser on the PDF file
 */
async function runATSParser(pdfBuffer: Buffer): Promise<ATSData> {
  const tmpDir = join(process.cwd(), 'tmp');
  const tmpFilePath = join(tmpDir, `resume-${Date.now()}.pdf`);

  try {
    // Create tmp directory if it doesn't exist
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Write PDF to temporary file
    await writeFile(tmpFilePath, pdfBuffer);

    // Execute Python script
    const pythonScript = join(process.cwd(), 'scripts', 'ats_parser.py');
    const { stdout, stderr } = await execAsync(`python3 ${pythonScript} ${tmpFilePath}`, {
      timeout: 8000, // 8 second timeout for Python script
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python script stderr:', stderr);
    }

    // Parse the JSON output
    const result: ATSParserResult = JSON.parse(stdout);

    if (!result.success) {
      // If pyresparser is not available, use fallback
      if (result.fallback) {
        console.warn('Using fallback ATS data:', result.error);
        return createFallbackATSData();
      }
      throw new Error(result.error || 'Unknown error from Python parser');
    }

    return result.data!;

  } catch (error) {
    console.error('Error running ATS parser:', error);
    // Return fallback data instead of failing completely
    return createFallbackATSData();
  } finally {
    // Clean up temporary file
    try {
      await unlink(tmpFilePath);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }
  }
}

/**
 * Create fallback ATS data when pyresparser is not available
 */
function createFallbackATSData(): ATSData {
  return {
    name: 'Not detected (pyresparser not available)',
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

    // Run ATS parser (this might use fallback if pyresparser is not available)
    const atsData = await runATSParser(buffer);

    // Analyze with Claude
    const analysis = await analyzeResume(rawText, atsData);

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
