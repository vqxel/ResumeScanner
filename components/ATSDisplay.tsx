'use client';

import type { ATSData } from '@/types';

interface ATSDisplayProps {
  data: ATSData | null;
}

export default function ATSDisplay({ data }: ATSDisplayProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">ATS extraction will appear here</p>
      </div>
    );
  }

  const isFallback = data.name?.includes('pyresparser not available');

  return (
    <div className="h-full overflow-auto bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        ATS Extracted Data
      </h2>

      {isFallback && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Note:</strong> ATS parser (pyresparser) is not available.
            This is a simplified view. Install pyresparser for full ATS extraction.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Contact Information */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
            Contact Information
          </h3>
          <div className="space-y-2">
            <InfoRow label="Name" value={data.name} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Phone" value={data.mobile_number} />
          </div>
        </section>

        {/* Education */}
        {(data.education.length > 0 || data.degree.length > 0) && (
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
              Education
            </h3>
            <div className="space-y-2">
              {data.degree.length > 0 && (
                <InfoRow label="Degrees" value={data.degree.join(', ')} />
              )}
              {data.education.length > 0 && (
                <InfoRow label="Institutions" value={data.education.join(', ')} />
              )}
            </div>
          </section>
        )}

        {/* Experience */}
        {(data.company_names.length > 0 || data.designation.length > 0) && (
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
              Work Experience
            </h3>
            <div className="space-y-2">
              {data.total_experience > 0 && (
                <InfoRow label="Total Experience" value={`${data.total_experience} years`} />
              )}
              {data.designation.length > 0 && (
                <InfoRow label="Positions" value={data.designation.join(', ')} />
              )}
              {data.company_names.length > 0 && (
                <InfoRow label="Companies" value={data.company_names.join(', ')} />
              )}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Document Info */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
            Document Information
          </h3>
          <div className="space-y-2">
            <InfoRow label="Pages" value={data.no_of_pages.toString()} />
          </div>
        </section>

        {/* Empty State */}
        {data.skills.length === 0 &&
         data.education.length === 0 &&
         data.company_names.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Limited data extracted by ATS parser.</p>
            <p className="text-sm mt-2">
              This may indicate ATS compatibility issues.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const displayValue = value === 'Not detected' || !value ? (
    <span className="text-gray-400 italic">Not detected</span>
  ) : (
    value
  );

  return (
    <div className="flex">
      <span className="font-medium text-gray-600 w-32 flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-800">{displayValue}</span>
    </div>
  );
}
