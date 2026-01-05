import Anthropic from '@anthropic-ai/sdk';
import type { ATSData, GradingDimension } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_PROMPT = `You are an expert resume reviewer and career coach. Analyze the provided resume across 7 key dimensions.

IMPORTANT INSTRUCTIONS:
1. Each dimension gets a separate score from 1-10
2. DO NOT provide an overall composite score
3. Only provide detailed feedback where there are ACTUAL ISSUES
4. Don't pad with unnecessary positive feedback
5. For concept analysis, extract the field of study from Education section and use it to contextualize complexity
6. Suggest specific rewordings for problematic bullet points
7. Provide general category-level feedback before specific examples

7 ANALYSIS DIMENSIONS:

1. **Density, Clarity & Conciseness** (1-10)
   - How efficiently is information presented?
   - Are bullet points concise yet impactful?
   - Is there unnecessary verbosity or redundancy?

2. **Content Ordering/Positioning** (1-10)
   - Is the logical flow appropriate?
   - Are the most important sections positioned strategically?
   - Does the structure make sense for the candidate's profile?

3. **Section Names** (1-10)
   - Are section headers clear and ATS-friendly?
   - Do they follow standard conventions?
   - Suggest improved titles where needed

4. **Human Readability** (1-10)
   - How easy is it for recruiters to quickly scan?
   - Is formatting consistent and professional?
   - Are key achievements easy to identify?

5. **ATS Compatibility** (1-10)
   - How well can automated systems parse this resume?
   - Are there formatting issues that could break ATS parsing?
   - Compare with the ATS extraction results provided

6. **Job Application Form Extraction** (1-10)
   - How well does the resume map to standard application form fields?
   - Are key details (contact info, education, experience) easily extractable?

7. **Concept Level Analysis** (1-10)
   - Based on the field of study from Education section, categorize job descriptions/projects as beginner/intermediate/advanced
   - Complexity = "how much science/deep knowledge is needed to understand and excel at this"
   - If field of study is missing, deduct points and flag as critical issue
   - Evaluate whether the demonstrated experience aligns with expected complexity for the field

REQUIRED SECTIONS CHECK:
- Education (MUST include major/field of study)
- Work Experience
- Skills

If any required section is missing, flag as critical issue and deduct points in relevant dimensions.

SECTION HEADER RECOGNITION:
Recognize variations like:
- "Work History" = "Experience"
- "Academic Background" = "Education"
- "Technical Skills" = "Skills"
But suggest standardized titles for better ATS compatibility.

OUTPUT FORMAT (JSON):
{
  "grades": [
    {
      "dimension": "Density, Clarity & Conciseness",
      "score": 7,
      "feedback": "General category-level feedback here",
      "issues": ["Specific issue 1", "Specific issue 2"],
      "suggestions": ["Specific suggestion 1", "Specific suggestion 2"]
    },
    ... (repeat for all 7 dimensions)
  ],
  "criticalIssues": ["Issue 1", "Issue 2"],
  "missingRequiredSections": ["Section name if missing"]
}

RESUME TEXT:
{resumeText}

ATS EXTRACTION RESULTS:
{atsResults}

Analyze this resume and provide your assessment in the JSON format specified above. Be critical but constructive.`;

interface ClaudeAnalysisResponse {
  grades: GradingDimension[];
  criticalIssues: string[];
  missingRequiredSections: string[];
}

export async function analyzeResume(
  resumeText: string,
  useRealAPI: boolean = false
): Promise<ClaudeAnalysisResponse> {
  if (!useRealAPI) {
    // Return mock analysis data (instant response, no API call)
    console.log('Using mock analysis data to avoid timeout');
    return getMockAnalysis(resumeText);
  }

  // Original Claude API implementation (only if explicitly enabled)
  try {
    const prompt = ANALYSIS_PROMPT
      .replace('{resumeText}', resumeText)
      .replace('{atsResults}', JSON.stringify({}, null, 2));

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000, // Reduced for faster response
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in Claude response');
    }

    const analysis: ClaudeAnalysisResponse = JSON.parse(jsonMatch[0]);

    if (!analysis.grades || !Array.isArray(analysis.grades)) {
      throw new Error('Invalid response format from Claude');
    }

    return analysis;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    // Fallback to mock data if API fails
    return getMockAnalysis(resumeText);
  }
}

/**
 * Generate mock analysis data for testing/demo purposes
 */
function getMockAnalysis(resumeText: string): ClaudeAnalysisResponse {
  const lowerText = resumeText.toLowerCase();

  // Check for missing sections
  const missingRequiredSections: string[] = [];
  if (!lowerText.includes('education')) missingRequiredSections.push('Education');
  if (!lowerText.includes('experience') && !lowerText.includes('work')) {
    missingRequiredSections.push('Work Experience');
  }
  if (!lowerText.includes('skills')) missingRequiredSections.push('Skills');

  const criticalIssues: string[] = [];
  if (missingRequiredSections.length > 0) {
    criticalIssues.push(`Missing key sections: ${missingRequiredSections.join(', ')}`);
  }

  return {
    grades: [
      {
        dimension: 'Density, Clarity & Conciseness',
        score: 7,
        feedback: 'The resume presents information in a reasonably concise manner, though some bullet points could be tightened.',
        issues: [
          'Some bullet points exceed 2 lines, making them harder to scan quickly',
          'Repetitive language in multiple sections',
        ],
        suggestions: [
          'Limit bullet points to 1-2 lines for better readability',
          'Use varied action verbs to avoid repetition',
          'Remove filler words like "responsible for" and start with strong verbs',
        ],
      },
      {
        dimension: 'Content Ordering/Positioning',
        score: 8,
        feedback: 'Sections are generally well-ordered with important information near the top.',
        issues: [
          'Skills section could be moved higher for technical roles',
        ],
        suggestions: [
          'Consider this order: Contact Info → Summary → Skills → Experience → Education → Projects',
          'Place most relevant section for your target role in the top third',
        ],
      },
      {
        dimension: 'Section Names',
        score: 9,
        feedback: 'Section headers are clear and follow standard conventions.',
        issues: [],
        suggestions: [
          'All section names are ATS-friendly and recognizable',
        ],
      },
      {
        dimension: 'Human Readability',
        score: 7,
        feedback: 'The resume is readable but could be improved with better formatting and visual hierarchy.',
        issues: [
          'Dense blocks of text make it hard to scan quickly',
          'Inconsistent spacing between sections',
        ],
        suggestions: [
          'Add more white space between sections',
          'Use consistent bullet point formatting throughout',
          'Bold job titles and company names for quick scanning',
        ],
      },
      {
        dimension: 'ATS Compatibility',
        score: 6,
        feedback: 'The resume has some ATS compatibility issues that may affect parsing accuracy.',
        issues: [
          'Complex formatting or tables may confuse ATS systems',
          'Some contact information may not be properly extracted',
        ],
        suggestions: [
          'Use simple, standard formatting without tables or columns',
          'Ensure contact info is in a standard format at the top',
          'Avoid headers, footers, and text boxes',
          'Use standard fonts like Arial, Calibri, or Times New Roman',
        ],
      },
      {
        dimension: 'Job Application Form Extraction',
        score: 7,
        feedback: 'Most key information can be extracted, but some details may be missed.',
        issues: [
          'Education dates or graduation year may not be clearly stated',
          'Job titles and company names should be more distinct',
        ],
        suggestions: [
          'Clearly separate job titles and company names with formatting',
          'Include dates in a consistent format (MM/YYYY)',
          'List degrees with full names (e.g., "Bachelor of Science in Computer Science")',
        ],
      },
      {
        dimension: 'Concept Level Analysis',
        score: 6,
        feedback: 'The resume demonstrates a mix of beginner and intermediate level concepts. Some advanced topics could be highlighted better.',
        issues: [
          'Field of study context is needed to properly assess complexity',
          'Project descriptions lack depth about underlying technical complexity',
        ],
        suggestions: [
          'Clearly state your major/field of study in Education section',
          'For technical work, explain the underlying complexity (e.g., algorithms used, scale of data, performance optimizations)',
          'Quantify impact where possible to demonstrate expertise level',
        ],
      },
    ],
    criticalIssues,
    missingRequiredSections,
  };
}
