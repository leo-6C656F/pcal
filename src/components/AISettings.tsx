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
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  useEffect(() => {
    updateStatus();
    // Load custom prompt from localStorage
    const saved = localStorage.getItem('aiPromptTemplate');
    if (saved) {
      setCustomPrompt(saved);
    }
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

  const handleSavePrompt = () => {
    if (customPrompt.trim()) {
      localStorage.setItem('aiPromptTemplate', customPrompt.trim());
      alert(t('aiSettings.promptSaved'));
    }
    setIsEditingPrompt(false);
  };

  const handleResetPrompt = () => {
    localStorage.removeItem('aiPromptTemplate');
    setCustomPrompt('');
    setIsEditingPrompt(false);
    alert(t('aiSettings.promptReset'));
  };

  const defaultPrompt = `Write one concise paragraph in past tense. Use ONLY the information provided below. Do not make up or infer activities. If custom notes are provided, integrate them naturally into a well-formed sentence. Do not include child's name or time spent:

{activities}

Compile this into a brief, professional summary focused on what was actually done.`;

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

        {/* Loading Progress - Compact Inline */}
        {modelLoadingState?.isLoading && (
          <div className="mb-3 flex items-center gap-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-indigo-900 font-medium">{modelLoadingState.status}</span>
                <span className="text-xs text-indigo-700">{modelLoadingState.progress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${modelLoadingState.progress}%` }}
                />
              </div>
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

      {/* Prompt Editor */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {t('aiSettings.promptTitle')}
          </h3>
          <button
            onClick={() => setIsEditingPrompt(!isEditingPrompt)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isEditingPrompt ? t('common.cancel') : t('common.edit')}
          </button>
        </div>

        {isEditingPrompt ? (
          <div className="space-y-3">
            <textarea
              value={customPrompt || defaultPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={defaultPrompt}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('common.save')}
              </button>
              <button
                onClick={handleResetPrompt}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                {t('aiSettings.resetToDefault')}
              </button>
            </div>
            <p className="text-sm text-slate-600">
              <strong>{t('aiSettings.note')}:</strong> Use <code className="bg-slate-100 px-1 rounded">{'{activities}'}</code> as a placeholder where the activity list should be inserted.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              {customPrompt ? t('aiSettings.customPrompt') : t('aiSettings.defaultPrompt')}:
            </p>
            <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono">
              {customPrompt || defaultPrompt}
            </pre>
            <p className="mt-3 text-sm text-slate-600">
              {t('aiSettings.promptDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
