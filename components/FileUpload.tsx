'use client';

import { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          onFileSelect(file);
        } else {
          alert('Please upload a PDF file');
        }
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          onFileSelect(file);
        } else {
          alert('Please upload a PDF file');
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-primary-300 bg-primary-50 hover:border-primary-400 hover:bg-primary-100 cursor-pointer'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className={`w-16 h-16 ${disabled ? 'text-gray-400' : 'text-primary-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p className={`text-lg font-semibold mb-2 ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
            {disabled ? 'Processing...' : 'Drop your resume here'}
          </p>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            or
          </p>
        </div>
        <label
          className={`inline-block px-6 py-3 rounded-lg font-semibold transition-colors ${
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />
          Choose File
        </label>
        <p className="text-xs text-gray-500 mt-2">
          PDF only • Max 10MB • 1 page recommended
        </p>
      </div>
    </div>
  );
}
