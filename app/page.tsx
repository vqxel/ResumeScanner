'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PDFViewer from '@/components/PDFViewer';
import ATSDisplay from '@/components/ATSDisplay';
import GradingSection from '@/components/GradingSection';
import type { AnalysisResult, AnalyzeResponse } from '@/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  // Toggle states
  const [usePythonATS, setUsePythonATS] = useState(false);
  const [useClaudeAPI, setUseClaudeAPI] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');
    setAnalysisResult(null);

    // Start analysis
    await analyzeResume(selectedFile);
  };

  const analyzeResume = async (fileToAnalyze: File) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', fileToAnalyze);
      formData.append('usePythonATS', usePythonATS.toString());
      formData.append('useClaudeAPI', useClaudeAPI.toString());

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data: AnalyzeResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setAnalysisResult(data.data);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadFeedback = () => {
    if (!analysisResult) return;

    let text = 'RESUME ANALYSIS FEEDBACK\n';
    text += '='.repeat(50) + '\n\n';

    // Critical Issues
    if (analysisResult.criticalIssues.length > 0) {
      text += 'CRITICAL ISSUES:\n';
      text += '-'.repeat(50) + '\n';
      analysisResult.criticalIssues.forEach((issue, i) => {
        text += `${i + 1}. ${issue}\n`;
      });
      text += '\n';
    }

    // Missing Sections
    if (analysisResult.missingRequiredSections.length > 0) {
      text += 'MISSING REQUIRED SECTIONS:\n';
      text += '-'.repeat(50) + '\n';
      analysisResult.missingRequiredSections.forEach((section, i) => {
        text += `${i + 1}. ${section}\n`;
      });
      text += '\n';
    }

    // Grades and Feedback
    text += 'DETAILED ANALYSIS:\n';
    text += '='.repeat(50) + '\n\n';

    analysisResult.grades.forEach((grade, index) => {
      text += `${index + 1}. ${grade.dimension.toUpperCase()}\n`;
      text += `   Score: ${grade.score}/10\n\n`;

      if (grade.feedback) {
        text += `   Overview:\n   ${grade.feedback}\n\n`;
      }

      if (grade.issues && grade.issues.length > 0) {
        text += `   Issues:\n`;
        grade.issues.forEach((issue) => {
          text += `   • ${issue}\n`;
        });
        text += '\n';
      }

      if (grade.suggestions && grade.suggestions.length > 0) {
        text += `   Suggestions:\n`;
        grade.suggestions.forEach((suggestion) => {
          text += `   ✓ ${suggestion}\n`;
        });
        text += '\n';
      }

      text += '-'.repeat(50) + '\n\n';
    });

    // Create and download file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis-feedback.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisResult(null);
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Resume Analyzer
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered ATS compatibility and quality assessment
              </p>
            </div>
            {analysisResult && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Analyze New Resume
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!file && !analysisResult && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Configuration Toggles */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Options</h2>
              <div className="space-y-4">
                {/* Python ATS Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label htmlFor="python-ats" className="font-medium text-gray-700 cursor-pointer">
                      Use Python ATS Parser
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      {usePythonATS
                        ? '⚠️ Slower but more accurate (requires Python dependencies)'
                        : '✓ Fast regex-based extraction (2-3s faster)'}
                    </p>
                  </div>
                  <button
                    id="python-ats"
                    type="button"
                    onClick={() => setUsePythonATS(!usePythonATS)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                      usePythonATS ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        usePythonATS ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Claude API Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex-1">
                    <label htmlFor="claude-api" className="font-medium text-gray-700 cursor-pointer">
                      Use Claude AI Analysis
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      {useClaudeAPI
                        ? '⚠️ Real AI feedback but slower (may timeout on Vercel free tier)'
                        : '✓ Fast mock data with realistic feedback'}
                    </p>
                  </div>
                  <button
                    id="claude-api"
                    type="button"
                    onClick={() => setUseClaudeAPI(!useClaudeAPI)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                      useClaudeAPI ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        useClaudeAPI ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Warning for both enabled */}
                {(usePythonATS || useClaudeAPI) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Performance Warning:</strong> With these options enabled, analysis may take{' '}
                      {usePythonATS && useClaudeAPI ? '10-15 seconds' : '5-10 seconds'} and could timeout on Vercel free tier.
                      {useClaudeAPI && ' Ensure you have set ANTHROPIC_API_KEY in environment variables.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <FileUpload onFileSelect={handleFileSelect} disabled={isAnalyzing} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Analyzing your resume...
            </h2>
            <p className="text-gray-600">
              {usePythonATS && useClaudeAPI && 'Using Python ATS + Real Claude AI (10-15 seconds)'}
              {usePythonATS && !useClaudeAPI && 'Using Python ATS + Mock Analysis (5-8 seconds)'}
              {!usePythonATS && useClaudeAPI && 'Using Regex ATS + Real Claude AI (8-12 seconds)'}
              {!usePythonATS && !useClaudeAPI && 'Using fast mode (2-3 seconds)'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Extracting text, running ATS analysis, and evaluating across 7 dimensions...
            </p>
          </div>
        )}

        {/* Results Section */}
        {analysisResult && !isAnalyzing && (
          <div className="space-y-8">
            {/* Analysis Info Badge */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-blue-900">Analysis Details:</span>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysisResult.parserUsed === 'python'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {analysisResult.parserUsed === 'python' ? '🐍 Python ATS' : '⚡ Regex ATS'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysisResult.analysisMode === 'claude'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analysisResult.analysisMode === 'claude' ? '🤖 Claude AI' : '📝 Mock Data'}
                  </span>
                </div>
              </div>
            </div>

            {/* Critical Issues Alert */}
            {analysisResult.criticalIssues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Critical Issues
                </h2>
                <ul className="space-y-2">
                  {analysisResult.criticalIssues.map((issue, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">•</span>
                      <span className="text-red-900">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - PDF Viewer */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Original Resume
                </h2>
                <div className="h-[600px]">
                  <PDFViewer file={file} />
                </div>
              </div>

              {/* Right Panel - ATS Extraction */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ATS Extraction
                </h2>
                <div className="h-[600px]">
                  <ATSDisplay data={analysisResult.atsData} />
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="text-center">
              <button
                onClick={downloadFeedback}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Feedback as Text File
              </button>
            </div>

            {/* Grading Sections */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Detailed Analysis (7 Dimensions)
              </h2>
              <div className="space-y-4">
                {analysisResult.grades.map((grade, index) => (
                  <GradingSection key={index} dimension={grade} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Powered by Claude AI • Built with Next.js and Tailwind CSS
          </p>
        </div>
      </footer>
    </main>
  );
}
