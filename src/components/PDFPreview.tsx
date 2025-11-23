import { useState, useEffect } from 'react';
import type { DailyEntry, ChildContext } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { Download, FileText } from 'lucide-react';

interface PDFPreviewProps {
  entry: DailyEntry;
  child: ChildContext;
  centerName: string;
  teacherName: string;
}

/**
 * PDFPreview Component
 * Generates and displays a PDF preview in an iframe
 */
export function PDFPreview({ entry, child, centerName, teacherName }: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const pdfBytes = await generatePDF({ entry, child, centerName, teacherName });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Clean up old URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const pdfBytes = await generatePDF({ entry, child, centerName, teacherName });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `PCAL-${child.name}-${entry.date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generatePreview}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <FileText size={16} />
          {isGenerating ? 'Generating...' : 'Generate Preview'}
        </button>

        {pdfUrl && (
          <button
            type="button"
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download size={16} />
            Download PDF
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {pdfUrl && (
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px]"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
