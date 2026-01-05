'use client';

import { useState } from 'react';
import type { GradingDimension } from '@/types';

interface GradingSectionProps {
  dimension: GradingDimension;
}

export default function GradingSection({ dimension }: GradingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const scoreColor = getScoreColor(dimension.score);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex-shrink-0 w-16 h-16 rounded-full ${scoreColor.bg} flex items-center justify-center`}>
            <span className={`text-2xl font-bold ${scoreColor.text}`}>
              {dimension.score}
            </span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-800">
              {dimension.dimension}
            </h3>
            <p className="text-sm text-gray-600">
              Click to {isExpanded ? 'collapse' : 'expand'} details
            </p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {/* General Feedback */}
          {dimension.feedback && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Overview</h4>
              <p className="text-gray-700 leading-relaxed">{dimension.feedback}</p>
            </div>
          )}

          {/* Issues */}
          {dimension.issues && dimension.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-700 mb-2">Issues Found</h4>
              <ul className="space-y-2">
                {dimension.issues.map((issue, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-red-600 flex-shrink-0">•</span>
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {dimension.suggestions && dimension.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Suggestions</h4>
              <ul className="space-y-2">
                {dimension.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty State */}
          {(!dimension.feedback || dimension.feedback.trim() === '') &&
           (!dimension.issues || dimension.issues.length === 0) &&
           (!dimension.suggestions || dimension.suggestions.length === 0) && (
            <p className="text-gray-500 italic">No detailed feedback available for this dimension.</p>
          )}
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): { bg: string; text: string } {
  if (score >= 8) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-700',
    };
  } else if (score >= 6) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
    };
  } else if (score >= 4) {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
    };
  } else {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
    };
  }
}
