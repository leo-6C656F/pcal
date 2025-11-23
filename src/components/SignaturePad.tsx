import { useRef, useEffect } from 'react';
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="label-text flex items-center gap-2 mb-0">
          <PenTool size={16} className="text-indigo-600" />
          Parent Signature
        </label>
        {signatureBase64 && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white hover:border-indigo-200 transition-colors">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-40 cursor-crosshair',
            style: { touchAction: 'none' }
          }}
          backgroundColor="white"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary flex-1"
        >
          <Trash2 size={16} className="mr-2 text-slate-500" />
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary flex-1 bg-slate-800 hover:bg-slate-900 focus:ring-slate-500"
        >
          <Check size={16} className="mr-2" />
          Save Signature
        </button>
      </div>
    </div>
  );
}
