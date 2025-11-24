import { useState, useEffect } from 'react';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { printPDF } from '../utils/printPdf';
import { emailPDF } from '../utils/emailPdf';
import { Download, FileText, Loader2, Printer, Mail } from 'lucide-react';

interface PDFPreviewProps {
  entries: DailyEntry[];  // Support multiple entries
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
}

/**
 * PDFPreview Component
 * Generates and displays a PDF preview in an iframe
 * Supports multiple daily entries on one PDF
 */
export function PDFPreview({ entries, child, centerName, teacherName, goals }: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate preview on mount
  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const pdfBytes = await generatePDF({ entries, child, centerName, teacherName, goals });
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
      const pdfBytes = await generatePDF({ entries, child, centerName, teacherName, goals });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const startDate = entries[0]?.date || 'unknown';
      const endDate = entries[entries.length - 1]?.date || startDate;
      const dateStr = startDate === endDate ? startDate : `${startDate}_to_${endDate}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = `PCAL-${child.name}-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  const handlePrintPDF = async () => {
    try {
      await printPDF({ entries, child, centerName, teacherName, goals });
    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Failed to print PDF');
    }
  };

  const handleEmailPDF = async () => {
    try {
      await emailPDF({ entries, child, centerName, teacherName, goals });
    } catch (err) {
      console.error('Email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to email PDF');
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
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-sm text-rose-800">Error: {error}</p>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider pl-2">
            Document Preview
          </span>
          <div className="flex gap-2">
            <button
              onClick={generatePreview}
              disabled={isGenerating}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Regenerate"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={downloadPDF}
              disabled={!pdfUrl}
              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[500px] bg-slate-100">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
              <div className="flex flex-col items-center text-slate-500">
                <Loader2 size={32} className="animate-spin mb-2 text-indigo-600" />
                <p className="text-sm font-medium">Generating PDF...</p>
              </div>
            </div>
          )}

          {pdfUrl && (
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-full"
              title="PDF Preview"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          type="button"
          onClick={handleEmailPDF}
          className="btn-primary w-full sm:w-auto"
        >
          <Mail size={18} className="mr-2" />
          Email PDF
        </button>
        <button
          type="button"
          onClick={handlePrintPDF}
          className="btn-secondary w-full sm:w-auto"
        >
          <Printer size={18} className="mr-2" />
          Print to PDF
        </button>
        <button
          type="button"
          onClick={downloadPDF}
          className="btn-secondary w-full sm:w-auto"
        >
          <Download size={18} className="mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
