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
): Promise<{ data: ATSData; parserUsed: 'python' | 'regex'; error?: string }> {
  if (!usePython) {
    // Use fast fallback for Vercel (saves 2-5 seconds)
    console.log('[ATS] Using regex-based parser (Python disabled by user)');
    return {
      data: createSmartFallbackATSData(resumeText),
      parserUsed: 'regex',
    };
  }

  // Original Python implementation (only runs if explicitly enabled)
  console.log('[ATS] Attempting to use Python parser...');
  // Use /tmp for Vercel compatibility (read-only filesystem except /tmp)
  const tmpDir = '/tmp';
  const tmpFilePath = join(tmpDir, `resume-${Date.now()}.pdf`);

  try {
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    await writeFile(tmpFilePath, pdfBuffer);

    const pythonScript = join(process.cwd(), 'scripts', 'ats_parser.py');
    console.log(`[ATS] Executing: python3 ${pythonScript} ${tmpFilePath}`);

    const { stdout, stderr } = await execAsync(`python3 ${pythonScript} ${tmpFilePath}`, {
      timeout: 5000, // Reduced to 5 second timeout
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('[ATS] Python script stderr:', stderr);
    }

    console.log('[ATS] Python script output:', stdout.substring(0, 200));

    const result: ATSParserResult = JSON.parse(stdout);

    if (!result.success) {
      console.warn('[ATS] Python parser returned failure, using regex fallback:', result.error);
      return {
        data: createSmartFallbackATSData(resumeText),
        parserUsed: 'regex',
        error: `Python parser failed: ${result.error}`,
      };
    }

    console.log('[ATS] Successfully used Python parser!');
    return {
      data: result.data!,
      parserUsed: 'python',
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ATS] Error running Python parser:', errorMsg);
    console.log('[ATS] Falling back to regex parser');
    return {
      data: createSmartFallbackATSData(resumeText),
      parserUsed: 'regex',
      error: `Failed to run Python parser: ${errorMsg}`,
    };
  } finally {
    try {
      await unlink(tmpFilePath);
    } catch (err) {
      console.error('[ATS] Error deleting temp file:', err);
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

  // Extract skills (improved to capture more technical terms)
  const skills: string[] = [];
  const skillsMatch = text.match(/skills?[:\s]*\n?([\s\S]*?)(?=\n(?:education|experience|professional|work|projects|extracurricular|summary|certifications|$))/im);

  if (skillsMatch) {
    const skillsText = skillsMatch[1];

    // Common programming/technical skills pattern
    const commonSkills = skillsText.match(/\b(?:JavaScript|TypeScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Git|HTML|CSS|C\+\+|C\#|Ruby|Go|Rust|Swift|Kotlin|PHP|R|Scala|MongoDB|PostgreSQL|Redis|Kubernetes|GraphQL|REST|API|Linux|Bash|Shell|Jenkins|CI\/CD|Agile|Scrum|TDD|OOP|Machine Learning|AI|Data Science|Analytics|Excel|Tableau|Power BI|Salesforce|SAP|Oracle|\.NET|Angular|Vue|Django|Flask|Spring|Laravel|Express|FastAPI|Pandas|NumPy|TensorFlow|PyTorch|Scikit-learn|Spark|Hadoop|Kafka|RabbitMQ|Elasticsearch|Nginx|Apache|Azure|GCP|CloudFormation|Terraform|Ansible|Puppet|Chef|Prometheus|Grafana|Datadog|Splunk|New Relic|Selenium|Cypress|Jest|Mocha|JUnit|TestNG|Postman|Swagger|OAuth|JWT|SAML|LDAP|Active Directory|Networking|Security|Penetration Testing|Ethical Hacking|OWASP|CISSP|CEH|CompTIA|ITIL|PMP|Six Sigma|Lean)\b/gi);

    // Hardware/embedded/FPGA specific skills
    const hardwareSkills = skillsText.match(/\b(?:Verilog|VHDL|SystemVerilog|VLSI|FPGA|Xilinx|Altera|Intel|Vivado|Quartus|ModelSim|QuestaSim|Cadence|Synopsys|Mentor|ASIC|RTL|RISC-V|ARM|x86|MIPS|OpenCL|CUDA|Vitis|HLS|PCB|KiCad|Altium|Eagle|SPICE|LTspice|Oscilloscope|Logic Analyzer|JTAG|I2C|SPI|UART|USB|Ethernet|CAN|PCI|DDR|LPDDR|SRAM|Flash|EEPROM|Microcontroller|STM32|Arduino|Raspberry Pi|ESP32|Teensy|AVR|PIC|MSP430|DSP|ADC|DAC|PWM|Timer|Interrupt|DMA|GPIO|Firmware|Bootloader|RTOS|FreeRTOS|Zephyr|Embedded Linux|Yocto|Buildroot)\b/gi);

    // Additional technical tools and frameworks
    const toolsSkills = skillsText.match(/\b(?:GitHub|GitLab|Bitbucket|JIRA|Confluence|Slack|Teams|Zoom|VS Code|Visual Studio|IntelliJ|PyCharm|Eclipse|Vim|Emacs|Sublime|Atom|Notepad\+\+|Make|CMake|Gradle|Maven|npm|pip|conda|Webpack|Babel|ESLint|Prettier|SonarQube|Splunk|Nagios|Zabbix|Ansible|Puppet|Chef|Salt|Vagrant|VirtualBox|VMware|Hyper-V)\b/gi);

    if (commonSkills) skills.push(...commonSkills);
    if (hardwareSkills) skills.push(...hardwareSkills);
    if (toolsSkills) skills.push(...toolsSkills);

    // Remove duplicates and limit
    const uniqueSkills = [...new Set(skills)];
    skills.length = 0;
    skills.push(...uniqueSkills.slice(0, 30));
  }

  // Extract education (improved pattern)
  const education: string[] = [];
  const degree: string[] = [];

  // Find education section more carefully
  const eduSectionMatch = text.match(/(?:^|\n)education[:\s]*\n([\s\S]*?)(?=\n(?:professional|experience|work|skills|projects|extracurricular|summary|objective|certifications|publications|awards|languages|volunteer|references|$))/im);

  if (eduSectionMatch) {
    const eduText = eduSectionMatch[1];

    // Extract universities
    const universities = eduText.match(/(?:University|College|Institute|School)[^,\n]{0,50}/gi);
    if (universities) {
      education.push(...universities.slice(0, 3));
    }

    // Extract degrees with better pattern
    const degreePatterns = [
      /\b(?:PhD|Ph\.D\.?|Doctor(?:ate)?)\s+(?:in\s+|of\s+)?[\w\s]+/gi,
      /\b(?:Master(?:'s)?|M\.S\.|MS|M\.A\.|MA|MBA)\s+(?:in\s+|of\s+)?[\w\s]+/gi,
      /\b(?:Bachelor(?:'s)?|B\.S\.|BS|B\.A\.|BA)\s+(?:in\s+|of\s+)?[\w\s]+/gi,
      /\b(?:Associate(?:'s)?|A\.S\.|AS|A\.A\.|AA)\s+(?:in\s+|of\s+)?[\w\s]+/gi,
    ];

    for (const pattern of degreePatterns) {
      const matches = eduText.match(pattern);
      if (matches) {
        degree.push(...matches.slice(0, 2));
      }
    }

    // If no degrees found with standard pattern, try simpler extraction
    if (degree.length === 0) {
      const simpleDegree = eduText.match(/(?:B\.S\.|BS|M\.S\.|MS|PhD|MBA|BA|MA)\s+[\w\s]+/gi);
      if (simpleDegree) {
        degree.push(...simpleDegree.slice(0, 2));
      }
    }
  }

  // Extract experience (improved)
  const designation: string[] = [];
  const company_names: string[] = [];

  // Find professional experience section
  const expSectionMatch = text.match(/(?:^|\n)(?:professional\s+)?(?:experience|work\s+(?:history|experience)|employment)[:\s]*\n([\s\S]*?)(?=\n(?:education|skills|projects|extracurricular|certifications|summary|volunteer|references|$))/im);

  if (expSectionMatch) {
    const expText = expSectionMatch[1];

    // Extract job titles with better patterns
    const titlePatterns = [
      /\b(?:Senior|Junior|Lead|Principal|Staff|Associate|Chief)\s+(?:Software|Hardware|Electrical|Mechanical|Data|ML|AI|DevOps|Site Reliability|Full[- ]?Stack|Front[- ]?End|Back[- ]?End|Embedded|Firmware|FPGA|ASIC|VLSI|RTL|Verification|Design|Product|Project|Program)\s+Engineer/gi,
      /\b(?:Senior|Junior|Lead|Principal|Staff|Associate)?\s*(?:Software|Hardware|Electrical|Mechanical|Data|ML|AI|DevOps)\s+(?:Engineer|Developer|Architect|Designer|Analyst|Scientist)/gi,
      /\b(?:Chief|Head\s+of|Director\s+of|VP\s+of|Manager\s+of)\s+[\w\s]{3,30}/gi,
      /\b(?:Intern|Internship|Co-op|Research\s+Assistant|Teaching\s+Assistant)/gi,
    ];

    for (const pattern of titlePatterns) {
      const matches = expText.match(pattern);
      if (matches) {
        designation.push(...matches);
      }
    }

    // Extract company names (look for common patterns)
    const companyPatterns = [
      /(?:at|@)\s+([A-Z][A-Za-z0-9\s&]{2,30}(?:Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Company|Co\.)?)/g,
      /\b([A-Z][A-Za-z]{3,}(?:\s+[A-Z][A-Za-z]{3,})*)\s+(?:Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Company|Co\.)/gi,
    ];

    for (const pattern of companyPatterns) {
      const matches = [...expText.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          company_names.push(match[1].trim());
        }
      }
    }

    // Remove duplicates
    const uniqueTitles = [...new Set(designation)];
    designation.length = 0;
    designation.push(...uniqueTitles.slice(0, 5));

    const uniqueCompanies = [...new Set(company_names)];
    company_names.length = 0;
    company_names.push(...uniqueCompanies.slice(0, 5));
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
    const [atsResult, analysis] = await Promise.all([
      runATSParser(buffer, rawText, usePythonATS),
      analyzeResume(rawText, useClaudeAPI),
    ]);

    // Add parser error to critical issues if it failed
    if (atsResult.error) {
      criticalIssues.push(atsResult.error);
    }

    console.log(`[Analysis] Parser used: ${atsResult.parserUsed}, Analysis mode: ${useClaudeAPI ? 'claude' : 'mock'}`);

    // Combine results
    const result: AnalysisResult = {
      grades: analysis.grades,
      atsData: atsResult.data,
      rawText,
      pageCount,
      criticalIssues: [...criticalIssues, ...analysis.criticalIssues],
      missingRequiredSections: analysis.missingRequiredSections,
      parserUsed: atsResult.parserUsed,
      analysisMode: useClaudeAPI ? 'claude' : 'mock',
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
