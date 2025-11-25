import { useState, useEffect } from 'react';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { printPDF } from '../utils/printPdf';
import { emailPDF } from '../utils/emailPdf';
import { Download, FileText, Loader2, Printer, Mail } from 'lucide-react';
import { useStore } from '../store';

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
  const { markEntriesAsSent } = useStore();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [markAsSent, setMarkAsSent] = useState(true);

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

  const handleEmailPDF = () => {
    setShowEmailConfirm(true);
  };

  const confirmEmailPDF = async () => {
    try {
      setShowEmailConfirm(false);
      await emailPDF({ entries, child, centerName, teacherName, goals });

      // Mark entries as sent if checkbox is checked
      if (markAsSent) {
        await markEntriesAsSent(entries.map(e => e.id));
      }
    } catch (err) {
      console.error('Email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to email PDF');
    }
  };

  const cancelEmailPDF = () => {
    setShowEmailConfirm(false);
    setMarkAsSent(true); // Reset to default
  };

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Count how many entries have already been sent
  const alreadySentCount = entries.filter(e => e.emailedAt).length;
  const hasAnySent = alreadySentCount > 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-sm text-rose-800">Error: {error}</p>
        </div>
      )}

      {showEmailConfirm && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <Mail size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-2">
                Confirm Email PDF
              </h4>
              {hasAnySent && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-3">
                  <p className="text-sm text-amber-900 font-medium mb-1">
                    ⚠️ Warning: Some entries were already sent
                  </p>
                  <p className="text-xs text-amber-800">
                    {alreadySentCount} of {entries.length} {alreadySentCount === 1 ? 'entry has' : 'entries have'} already been emailed.
                    You can still send them again if needed.
                  </p>
                </div>
              )}
              <p className="text-sm text-amber-800 mb-4">
                This will download the PDF and open your email client. You'll need to attach the PDF before sending.
              </p>
              <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  checked={markAsSent}
                  onChange={(e) => setMarkAsSent(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Mark {entries.length === 1 ? 'this entry' : 'these entries'} as sent
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {entries.length === 1 ? 'This entry' : 'These entries'} will be tagged with a "Sent" badge and timestamp to help you avoid sending duplicates.
                  </p>
                </div>
              </label>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={cancelEmailPDF}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={confirmEmailPDF}
              className="btn-primary"
            >
              <Mail size={18} className="mr-2" />
              Continue to Email
            </button>
          </div>
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
