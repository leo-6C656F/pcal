import { useState, useEffect } from 'react';
import { FileText, Check } from 'lucide-react';

export type PDFGenerationMethod = 'html-canvas' | 'word-docx';

/**
 * PDFSettings Component
 * Configure PDF generation method
 */
export function PDFSettings() {
  const [pdfMethod, setPdfMethod] = useState<PDFGenerationMethod>('html-canvas');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('pdfGenerationMethod');
    if (saved === 'word-docx' || saved === 'html-canvas') {
      setPdfMethod(saved);
    } else if (saved === 'word-pdf') {
      // Migrate old setting to new value
      setPdfMethod('word-docx');
      localStorage.setItem('pdfGenerationMethod', 'word-docx');
    }
  }, []);

  const handleMethodChange = (method: PDFGenerationMethod) => {
    setPdfMethod(method);
    localStorage.setItem('pdfGenerationMethod', method);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">PDF Generation Settings</h1>
        <p className="text-slate-500 mt-1">Choose how PDFs are generated for your activity logs</p>
      </div>

      {/* PDF Generation Method Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                PDF Generation Method
              </h3>
              <p className="text-sm text-slate-500">
                Select your preferred method for generating PDF reports
              </p>
            </div>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <Check size={16} />
              <span className="text-sm font-medium">Saved</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* HTML Canvas Method (Default) */}
          <div
            onClick={() => handleMethodChange('html-canvas')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              pdfMethod === 'html-canvas'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                pdfMethod === 'html-canvas'
                  ? 'border-primary bg-primary'
                  : 'border-slate-300'
              }`}>
                {pdfMethod === 'html-canvas' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">HTML Canvas (Default)</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Converts HTML template to canvas, then embeds as image in PDF
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Works offline (no server required)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Fast generation</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Pixel-perfect rendering</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-amber-600">⚠</span>
                    <span className="text-slate-600">Text is not searchable/selectable (image-based)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-amber-600">⚠</span>
                    <span className="text-slate-600">Larger file sizes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Word Document Method (New) */}
          <div
            onClick={() => handleMethodChange('word-docx')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              pdfMethod === 'word-docx'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                pdfMethod === 'word-docx'
                  ? 'border-primary bg-primary'
                  : 'border-slate-300'
              }`}>
                {pdfMethod === 'word-docx' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">Word Document (.docx)</h4>
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                    New
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Generates editable Word documents from HTML with perfect formatting
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Preserves all HTML formatting automatically</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Fully editable in Microsoft Word or LibreOffice</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Real text (searchable, copyable, accessible)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="text-slate-600">Smaller file sizes than canvas method</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600">ℹ</span>
                    <span className="text-slate-600">Uses serverless API (works on Vercel)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-amber-600">ℹ</span>
                    <span className="text-slate-600">Downloads as .docx file (convert to PDF in Word)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Your selection will be saved and used for all future exports.
            You can change this setting at any time.
            {pdfMethod === 'word-docx' && (
              <span className="block mt-2">
                <strong>Tip:</strong> After downloading the .docx file, you can convert it to PDF using Microsoft Word (File → Save As → PDF)
                or LibreOffice (File → Export as PDF) for the best quality PDF output.
              </span>
            )}
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Feature Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Feature</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">HTML Canvas</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">Word Document</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Output Format</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-slate-700">PDF</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-slate-700">.docx</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Works Offline</td>
                  <td className="text-center py-2 px-3">
                    <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="inline-block w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">✗</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Deployment</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Client-side only</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-blue-600">Serverless API</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Searchable Text</td>
                  <td className="text-center py-2 px-3">
                    <span className="inline-block w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">✗</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">File Size</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-amber-600">Larger</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Smaller</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Print Quality</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Excellent</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Excellent*</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Editable</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-red-600">No</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Yes</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Generation Speed</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Fast</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Fast</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Ready to Submit</td>
                  <td className="text-center py-2 px-3">
                    <span className="text-green-600">Yes (PDF)</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="text-amber-600">After conversion</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * Excellent when converted to PDF using Word or LibreOffice
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to get current PDF generation method
 */
export function getPDFGenerationMethod(): PDFGenerationMethod {
  const saved = localStorage.getItem('pdfGenerationMethod');
  if (saved === 'word-docx' || saved === 'html-canvas') {
    return saved;
  }
  // Migrate old 'word-pdf' setting to 'word-docx'
  if (saved === 'word-pdf') {
    localStorage.setItem('pdfGenerationMethod', 'word-docx');
    return 'word-docx';
  }
  return 'html-canvas'; // Default
}
