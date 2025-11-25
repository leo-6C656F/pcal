import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { DailyEntry, ChildContext, Goal } from '../types';
import { generatePDF } from '../services/pdfGenerator';
import { printPDF } from '../utils/printPdf';
import { emailPDF } from '../utils/emailPdf';
import { Download, FileText, Loader2, Printer, Mail, X } from 'lucide-react';
import { useStore } from '../store';

interface PDFPreviewProps {
  entries: DailyEntry[];  // Support multiple entries
  child: ChildContext;
  centerName: string;
  teacherName: string;
  goals: Goal[];
  onClose?: () => void;  // Optional close handler
}

/**
 * PDFPreview Component
 * Generates and displays a PDF preview in an iframe
 * Supports multiple daily entries on one PDF
 */
export function PDFPreview({ entries, child, centerName, teacherName, goals, onClose }: PDFPreviewProps) {
  const { t } = useTranslation();
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

  // Generate email subject line
  const startDate = entries[0]?.date || 'unknown';
  const endDate = entries[entries.length - 1]?.date || startDate;
  const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const emailSubject = `PCAL Report - ${child.name} - ${dateRange}`;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-sm text-rose-800">{t('common.error')}: {error}</p>
        </div>
      )}

      {/* Email Subject Line Display */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-indigo-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">{t('pdfPreview.emailSubject')}</span>
            <p className="text-sm font-medium text-indigo-900 truncate">{emailSubject}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Compact at Top */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleEmailPDF}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Mail size={14} className="mr-1.5" />
          {t('pdfPreview.emailPdf')}
        </button>
        <button
          type="button"
          onClick={handlePrintPDF}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Printer size={14} className="mr-1.5" />
          {t('pdfPreview.printToPdf')}
        </button>
        <button
          type="button"
          onClick={downloadPDF}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download size={14} className="mr-1.5" />
          {t('pdfPreview.downloadPdf')}
        </button>
      </div>

      {showEmailConfirm && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <Mail size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-2">
                {t('pdfPreview.confirmEmailPdf')}
              </h4>
              {hasAnySent && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-3">
                  <p className="text-sm text-amber-900 font-medium mb-1">
                    ⚠️ {t('pdfPreview.warningAlreadySent')}
                  </p>
                  <p className="text-xs text-amber-800">
                    {t('pdfPreview.alreadySentCount', { sent: alreadySentCount, total: entries.length })}
                    {' '}{t('pdfPreview.canSendAgain')}
                  </p>
                </div>
              )}
              <p className="text-sm text-amber-800 mb-4">
                {t('pdfPreview.emailInstructions')}
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
                    {t('pdfPreview.markAsSent', { count: entries.length })}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {t('pdfPreview.markAsSentDescription', { count: entries.length })}
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
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmEmailPDF}
              className="btn-primary"
            >
              <Mail size={18} className="mr-2" />
              {t('pdfPreview.continueToEmail')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider pl-2">
            {t('pdfPreview.documentPreview')}
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={generatePreview}
              disabled={isGenerating}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={t('pdfPreview.regenerate')}
            >
              <FileText size={16} />
            </button>
            <button
              onClick={downloadPDF}
              disabled={!pdfUrl}
              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
              title={t('common.download')}
            >
              <Download size={16} />
            </button>
            {onClose && (
              <>
                <div className="w-px h-5 bg-slate-700 mx-1" />
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title={t('common.close')}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative w-full h-[500px] bg-slate-100">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
              <div className="flex flex-col items-center text-slate-500">
                <Loader2 size={32} className="animate-spin mb-2 text-indigo-600" />
                <p className="text-sm font-medium">{t('pdfPreview.generatingPdf')}</p>
              </div>
            </div>
          )}

          {pdfUrl && (
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-full"
              title={t('pdfPreview.pdfPreviewTitle')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
