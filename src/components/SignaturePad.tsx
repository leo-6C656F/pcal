import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

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
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Parent Signature
      </label>

      <div className="border-2 border-gray-300 rounded-md overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-40',
            style: { touchAction: 'none' }
          }}
          backgroundColor="white"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Signature
        </button>
      </div>

      {signatureBase64 && (
        <div className="text-sm text-green-600">
          ✓ Signature saved
        </div>
      )}
    </div>
  );
}
