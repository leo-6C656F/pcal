import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Trash2, Check } from 'lucide-react';

interface SignaturePadProps {
  signatureBase64?: string;
  onSave: (signatureBase64: string) => void;
}

/**
 * SignaturePad Component
 * Allows user to draw a signature
 */
export function SignaturePad({ signatureBase64, onSave }: SignaturePadProps) {
  const { t } = useTranslation();
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    // Load existing signature if available
    if (signatureBase64 && sigCanvas.current) {
      sigCanvas.current.fromDataURL(signatureBase64);
    }
  }, [signatureBase64]);

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current) {
      // Check if empty
      if (sigCanvas.current.isEmpty()) {
        // optional: alert('Please provide a signature first');
        return;
      }
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  const isEmpty = sigCanvas.current?.isEmpty() ?? true;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <label className="label-text flex items-center gap-2 mb-1">
            <PenTool size={16} className="text-indigo-600" />
            {t('signaturePad.parentSignature')}
          </label>
          <p className="text-xs text-slate-500">
            {t('signaturePad.signInstructions')}
          </p>
        </div>
        {signatureBase64 && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
            <Check size={12} /> {t('common.saved')}
          </span>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white hover:border-indigo-300 transition-colors">
        {/* Ghost text when empty */}
        {isEmpty && !signatureBase64 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center">
              <PenTool size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">{t('signaturePad.signHere')}</p>
            </div>
          </div>
        )}
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-44 cursor-crosshair relative z-10',
            style: { touchAction: 'none' }
          }}
          backgroundColor="rgba(255, 255, 255, 0)"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary flex-1"
        >
          <Trash2 size={16} className="mr-2 text-slate-500" />
          {t('common.clear')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          <Check size={16} className="mr-2" />
          {t('signaturePad.saveSignature')}
        </button>
      </div>
    </div>
  );
}
