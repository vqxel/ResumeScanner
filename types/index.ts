// Type definitions for Resume Analyzer

export interface ATSData {
  name: string;
  email: string;
  mobile_number: string;
  skills: string[];
  education: string[];
  degree: string[];
  designation: string[];
  experience: string[];
  company_names: string[];
  no_of_pages: number;
  total_experience: number;
}

export interface GradingDimension {
  dimension: string;
  score: number;
  feedback: string;
  issues: string[];
  suggestions: string[];
}

export interface AnalysisResult {
  grades: GradingDimension[];
  atsData: ATSData;
  rawText: string;
  pageCount: number;
  criticalIssues: string[];
  missingRequiredSections: string[];
  parserUsed: 'python' | 'regex';
  analysisMode: 'claude' | 'mock';
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface ATSParserResult {
  success: boolean;
  data?: ATSData;
  error?: string;
  fallback?: boolean;
}
