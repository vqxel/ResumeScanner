'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File | null;
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string>('');

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError('');
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Upload a PDF to preview</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 rounded-lg">
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      ) : (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          }
          className="flex flex-col items-center p-4"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-lg">
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="max-w-full"
                width={Math.min(window.innerWidth * 0.4, 800)}
              />
              {numPages > 1 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Page {index + 1} of {numPages}
                </p>
              )}
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
