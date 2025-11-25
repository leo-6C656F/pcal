import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import {
  isModelReady,
  initializeModel,
  clearModelCache,
  getModelCacheSize,
  unloadModel,
  getLoadError
} from '../services/aiService';
import type { ModelLoadingState } from '../types';

export function AISettings() {
  const { t } = useTranslation();
  const [modelStatus, setModelStatus] = useState<'ready' | 'not-loaded' | 'error'>('not-loaded');
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isRedownloading, setIsRedownloading] = useState(false);
  const [modelLoadingState, setModelLoadingState] = useState<ModelLoadingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = async () => {
    const ready = isModelReady();
    const loadErr = getLoadError();

    if (loadErr) {
      setModelStatus('error');
      setError(loadErr);
    } else if (ready) {
      setModelStatus('ready');
    } else {
      setModelStatus('not-loaded');
    }

    const size = await getModelCacheSize();
    setCacheSize(size);
  };

  const handleClearCache = async () => {
    if (!confirm(t('aiSettings.confirmClear'))) return;

    setIsClearing(true);
    setError(null);

    try {
      await clearModelCache();
      await updateStatus();
      alert(t('aiSettings.cacheCleared'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      alert(t('aiSettings.clearFailed') + ': ' + errorMsg);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRedownload = async () => {
    setIsRedownloading(true);
    setError(null);

    try {
      // First clear the cache
      await clearModelCache();

      // Then reinitialize
      const success = await initializeModel((state) => {
        setModelLoadingState(state);
      });

      if (success) {
        await updateStatus();
        alert(t('aiSettings.redownloadSuccess'));
      } else {
        throw new Error('Model initialization failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      alert(t('aiSettings.redownloadFailed') + ': ' + errorMsg);
    } finally {
      setIsRedownloading(false);
      setModelLoadingState(null);
    }
  };

  const handleUnloadModel = () => {
    unloadModel();
    updateStatus();
    alert(t('aiSettings.modelUnloaded'));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('aiSettings.title')}</h1>
        <p className="text-slate-500 mt-1">{t('aiSettings.subtitle')}</p>
      </div>

      {/* Model Status Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              modelStatus === 'ready' ? 'bg-green-100 text-green-600' :
              modelStatus === 'error' ? 'bg-red-100 text-red-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              <Brain size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('aiSettings.transformersModel')}
              </h3>
              <p className="text-sm text-slate-500">
                Xenova/LaMini-Flan-T5-248M (~21MB)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {modelStatus === 'ready' && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">{t('aiSettings.loaded')}</span>
              </div>
            )}
            {modelStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                <XCircle size={16} />
                <span className="text-sm font-medium">{t('aiSettings.error')}</span>
              </div>
            )}
            {modelStatus === 'not-loaded' && (
              <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{t('aiSettings.notLoaded')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>{t('aiSettings.errorLabel')}:</strong> {error}
            </p>
          </div>
        )}

        {/* Cache Info */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <HardDrive size={18} />
              <span className="text-sm font-medium">{t('aiSettings.cacheSize')}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {formatBytes(cacheSize)}
            </span>
          </div>
        </div>

        {/* Loading Progress */}
        {modelLoadingState?.isLoading && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-indigo-900 font-medium">{modelLoadingState.status}</span>
              <span className="text-indigo-700">{modelLoadingState.progress}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${modelLoadingState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleRedownload}
            disabled={isRedownloading || isClearing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRedownloading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t('aiSettings.downloading')}</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>{t('aiSettings.redownload')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleClearCache}
            disabled={isClearing || isRedownloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t('aiSettings.clearing')}</span>
              </>
            ) : (
              <>
                <Trash2 size={18} />
                <span>{t('aiSettings.clearCache')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleUnloadModel}
            disabled={modelStatus !== 'ready' || isClearing || isRedownloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle size={18} />
            <span>{t('aiSettings.unload')}</span>
          </button>
        </div>

        {/* Info Text */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>{t('aiSettings.note')}:</strong> {t('aiSettings.noteText')}
          </p>
        </div>
      </div>

      {/* Prompt Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {t('aiSettings.promptTitle')}
        </h3>
        <div className="p-4 bg-slate-50 rounded-lg font-mono text-sm text-slate-700">
          <p className="mb-2">
            <strong>Prompt Template:</strong>
          </p>
          <code className="block whitespace-pre-wrap break-words">
            {`Write a concise, high-level summary in past tense describing developmental progress. Focus on what skills were developed, not specific activities or durations. Activities listed are examples of what the child did:
- [Goal]: [Activities] (Custom Notes)
- ...

Do not include the child's name or time spent. Keep it professional and focused on developmental outcomes.`}
          </code>
          <p className="mt-3 text-slate-600">
            {t('aiSettings.promptDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
