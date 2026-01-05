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
  atsData: ATSData
): Promise<ClaudeAnalysisResponse> {
  try {
    const prompt = ANALYSIS_PROMPT
      .replace('{resumeText}', resumeText)
      .replace('{atsResults}', JSON.stringify(atsData, null, 2));

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text content from the response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    // Try to parse JSON from the response
    // Claude might wrap it in markdown code blocks, so we need to extract it
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in Claude response');
    }

    const analysis: ClaudeAnalysisResponse = JSON.parse(jsonMatch[0]);

    // Validate the response has all required fields
    if (!analysis.grades || !Array.isArray(analysis.grades)) {
      throw new Error('Invalid response format from Claude');
    }

    return analysis;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error(
      `Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
