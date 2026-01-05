import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resume Analyzer - AI-Powered ATS Compatibility Checker',
  description: 'Upload your resume and get detailed feedback on ATS compatibility, readability, and content quality across 7 key dimensions.',
  keywords: 'resume analyzer, ATS checker, resume feedback, job application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
