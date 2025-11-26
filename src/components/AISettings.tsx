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
  HardDrive,
  Sliders,
  RotateCcw,
  Cloud,
  Key,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { showToast } from '../App';
import {
  isModelReady,
  initializeModel,
  clearModelCache,
  getModelCacheSize,
  unloadModel,
  getLoadError,
  getAISettings,
  saveAISettings
} from '../services/aiService';
import { getSelectedModelId, setSelectedModelId } from '../services/transformersService';
import type { ModelLoadingState, AIGenerationSettings } from '../types';
import { DEFAULT_AI_SETTINGS, PREDEFINED_MODELS } from '../types';

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
  const [genSettings, setGenSettings] = useState<AIGenerationSettings>(DEFAULT_AI_SETTINGS);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customModelId, setCustomModelId] = useState<string>('');
  const [isCustomModel, setIsCustomModel] = useState(false);

  // OpenAI settings
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [openAIModel, setOpenAIModel] = useState<string>('gpt-4o-mini');
  const [openAIBaseURL, setOpenAIBaseURL] = useState<string>('');
  const [providerPriority, setProviderPriority] = useState<'local-first' | 'openai-first'>('local-first');

  // Inline confirmation states
  const [confirmingClearCache, setConfirmingClearCache] = useState(false);

  useEffect(() => {
    updateStatus();
    // Load custom prompt from localStorage
    const saved = localStorage.getItem('aiPromptTemplate');
    if (saved) {
      setCustomPrompt(saved);
    }
    // Load generation settings
    setGenSettings(getAISettings());

    // Load selected model
    const currentModel = getSelectedModelId();
    setSelectedModel(currentModel);

    // Check if it's a custom model (not in predefined list)
    const isPredefined = PREDEFINED_MODELS.some(m => m.id === currentModel);
    if (!isPredefined) {
      setIsCustomModel(true);
      setCustomModelId(currentModel);
    }

    // Load OpenAI configuration
    const savedOpenAIConfig = localStorage.getItem('openAIConfig');
    if (savedOpenAIConfig) {
      try {
        const config = JSON.parse(savedOpenAIConfig);
        setOpenAIKey(config.openAIKey || '');
        setOpenAIModel(config.openAIModel || 'gpt-4o-mini');
        setOpenAIBaseURL(config.openAIBaseURL || '');
        setProviderPriority(config.providerPriority || 'local-first');
      } catch (e) {
        console.error('Failed to parse OpenAI config:', e);
      }
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
    setIsClearing(true);
    setError(null);
    setConfirmingClearCache(false);

    try {
      await clearModelCache();
      await updateStatus();
      showToast?.success(t('aiSettings.cacheCleared'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      showToast?.error(t('aiSettings.clearFailed') + ': ' + errorMsg);
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
        showToast?.success(t('aiSettings.redownloadSuccess'));
      } else {
        throw new Error('Model initialization failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      showToast?.error(t('aiSettings.redownloadFailed') + ': ' + errorMsg);
    } finally {
      setIsRedownloading(false);
      setModelLoadingState(null);
    }
  };

  const handleUnloadModel = () => {
    unloadModel();
    updateStatus();
    showToast?.info(t('aiSettings.modelUnloaded'));
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
      showToast?.success(t('aiSettings.promptSaved'));
    }
    setIsEditingPrompt(false);
  };

  const handleResetPrompt = () => {
    localStorage.removeItem('aiPromptTemplate');
    setCustomPrompt('');
    setIsEditingPrompt(false);
    showToast?.info(t('aiSettings.promptReset'));
  };

  const handleSettingChange = (key: keyof AIGenerationSettings, value: number | boolean) => {
    const newSettings = { ...genSettings, [key]: value };
    setGenSettings(newSettings);
    saveAISettings(newSettings);
  };

  const handleResetSettings = () => {
    setGenSettings(DEFAULT_AI_SETTINGS);
    saveAISettings(DEFAULT_AI_SETTINGS);
    showToast?.info(t('aiSettings.settingsReset'));
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedModelId(modelId);

    // Check if switching to custom mode
    if (modelId === 'custom') {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
      setCustomModelId('');
    }
  };

  const handleCustomModelSave = () => {
    if (!customModelId.trim()) {
      showToast?.error('Please enter a valid model ID');
      return;
    }

    setSelectedModelId(customModelId.trim());
    setSelectedModel(customModelId.trim());
    showToast?.success('Custom model saved. Please reload the model to use it.');
  };

  const handleSaveOpenAIConfig = () => {
    const config = {
      openAIKey,
      openAIModel,
      openAIBaseURL,
      providerPriority
    };
    localStorage.setItem('openAIConfig', JSON.stringify(config));
    showToast?.success('OpenAI configuration saved successfully!');
  };

  const defaultPrompt = `Rewrite the activities below into one concise sentence in past tense describing only what the parent did.
Follow these strict rules:
- Use ONLY the actions written.
- Do NOT mention the child.
- Do NOT talk about goals, communication, development, or purpose.
- Do NOT add, infer, or interpret anything not written.
- Do NOT mention time or duration.
- Generalize parentheses details (e.g., "Mirror play (eyes, nose, mouth)" → "Parent did mirror play." or "Using sign language (more, all done)" → "Parent practiced sign language.").

Example input: Repetition with songs (Brown Bear)
Example output: Parent practiced repetition with songs.

Activities to rewrite:
{activities}

Final sentence:`;

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
                {selectedModel || 'Not selected'}
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
          <div className="mb-3 flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-blue-900 font-medium">{modelLoadingState.status}</span>
                <span className="text-xs text-primary">{modelLoadingState.progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {confirmingClearCache ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in-0 zoom-in-95 duration-150">
              <AlertTriangle size={16} className="text-rose-600" />
              <span className="text-sm text-rose-700">{t('aiSettings.confirmClear')}</span>
              <button
                onClick={() => setConfirmingClearCache(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors disabled:opacity-50"
              >
                {isClearing ? t('aiSettings.clearing') : t('aiSettings.clearCache')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClearCache(true)}
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
          )}

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

      {/* Model Selection Card */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Model Selection</h3>
          <p className="text-sm text-slate-500 mt-1">
            Choose from predefined models or enter a custom Hugging Face model ID
          </p>
        </div>

        <div className="space-y-4">
          {/* Predefined Models Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Model
            </label>
            <select
              value={isCustomModel ? 'custom' : selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {PREDEFINED_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description} ({model.size})
                </option>
              ))}
              <option value="custom">Custom Model (Enter manually)</option>
            </select>
          </div>

          {/* Custom Model Input */}
          {isCustomModel && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Model ID
                </label>
                <input
                  type="text"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="e.g., Xenova/gpt2 or username/model-name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter a Hugging Face model ID. Must be compatible with text2text-generation or text-generation tasks.
                </p>
              </div>
              <button
                onClick={handleCustomModelSave}
                disabled={!customModelId.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Custom Model
              </button>
            </div>
          )}

          {/* Model Change Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> After changing the model, you must click "Download/Reload Model" above to download and use the new model. The old model will remain cached unless you clear the cache.
            </p>
          </div>
        </div>
      </div>

      {/* OpenAI Configuration Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                OpenAI API Configuration
              </h3>
              <p className="text-sm text-slate-500">
                Configure OpenAI API as a fallback or primary provider
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Provider Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Provider Priority
            </label>
            <select
              value={providerPriority}
              onChange={(e) => setProviderPriority(e.target.value as 'local-first' | 'openai-first')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="local-first">Local Model First (OpenAI as fallback)</option>
              <option value="openai-first">OpenAI First (Local as fallback)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Choose which AI provider to try first when generating summaries
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Key size={16} />
              OpenAI API Key
            </label>
            <input
              type="password"
              value={openAIKey}
              onChange={(e) => setOpenAIKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your OpenAI API key. Stored locally in your browser.
            </p>
          </div>

          {/* OpenAI Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              OpenAI Model
            </label>
            <select
              value={openAIModel}
              onChange={(e) => setOpenAIModel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recommended - Fast & Affordable)</option>
              <option value="gpt-4o">GPT-4o (Most Capable)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest & Cheapest)</option>
              <option value="gpt-4">GPT-4 (Legacy)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Select which OpenAI model to use for summary generation
            </p>
          </div>

          {/* Base URL (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Globe size={16} />
              API Base URL (Optional)
            </label>
            <input
              type="text"
              value={openAIBaseURL}
              onChange={(e) => setOpenAIBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1 (default)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Custom API endpoint for OpenAI-compatible services (Azure, LocalAI, etc.)
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveOpenAIConfig}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Save OpenAI Configuration
          </button>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Privacy Note:</strong> Your API key is stored only in your browser's local storage and is never sent to our servers. It's used directly to communicate with OpenAI's API from your browser.
            </p>
          </div>
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
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            {isEditingPrompt ? t('common.cancel') : t('common.edit')}
          </button>
        </div>

        {isEditingPrompt ? (
          <div className="space-y-3">
            <textarea
              value={customPrompt || defaultPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder={defaultPrompt}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
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

      {/* Generation Settings Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Sliders size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('aiSettings.generationTitle')}
              </h3>
              <p className="text-sm text-slate-500">
                {t('aiSettings.generationDescription')}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetSettings}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <RotateCcw size={16} />
            {t('aiSettings.resetToDefault')}
          </button>
        </div>

        <div className="space-y-6">
          {/* Max New Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                {t('aiSettings.maxTokens')}
              </label>
              <span className="text-sm font-semibold text-primary">{genSettings.maxNewTokens}</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={genSettings.maxNewTokens}
              onChange={(e) => handleSettingChange('maxNewTokens', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="mt-1 text-xs text-slate-500">{t('aiSettings.maxTokensHelp')}</p>
          </div>

          {/* Min Length */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                {t('aiSettings.minLength')}
              </label>
              <span className="text-sm font-semibold text-primary">{genSettings.minLength}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={genSettings.minLength}
              onChange={(e) => handleSettingChange('minLength', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="mt-1 text-xs text-slate-500">{t('aiSettings.minLengthHelp')}</p>
          </div>

          {/* Do Sample Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-700">
                {t('aiSettings.useSampling')}
              </label>
              <p className="text-xs text-slate-500 mt-1">{t('aiSettings.useSamplingHelp')}</p>
            </div>
            <button
              onClick={() => handleSettingChange('doSample', !genSettings.doSample)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                genSettings.doSample ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  genSettings.doSample ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Temperature - Only visible when sampling is enabled */}
          {genSettings.doSample && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('aiSettings.temperature')}
                  </label>
                  <span className="text-sm font-semibold text-primary">{genSettings.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={genSettings.temperature}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="mt-1 text-xs text-slate-500">{t('aiSettings.temperatureHelp')}</p>
              </div>

              {/* Top P */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t('aiSettings.topP')}
                  </label>
                  <span className="text-sm font-semibold text-primary">{genSettings.topP.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={genSettings.topP}
                  onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="mt-1 text-xs text-slate-500">{t('aiSettings.topPHelp')}</p>
              </div>

              {/* Top K */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Top K
                  </label>
                  <span className="text-sm font-semibold text-primary">{genSettings.topK}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={genSettings.topK}
                  onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="mt-1 text-xs text-slate-500">Sample from top K tokens (0 = disabled)</p>
              </div>
            </>
          )}

          {/* Repetition Penalty */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Repetition Penalty
              </label>
              <span className="text-sm font-semibold text-primary">{genSettings.repetitionPenalty.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.1"
              value={genSettings.repetitionPenalty}
              onChange={(e) => handleSettingChange('repetitionPenalty', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="mt-1 text-xs text-slate-500">Penalize repeated tokens (1.0 = no penalty, higher = less repetition)</p>
          </div>

          {/* No Repeat N-Gram Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                No Repeat N-Gram Size
              </label>
              <span className="text-sm font-semibold text-primary">{genSettings.noRepeatNgramSize}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={genSettings.noRepeatNgramSize}
              onChange={(e) => handleSettingChange('noRepeatNgramSize', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="mt-1 text-xs text-slate-500">Prevent repeating n-grams of this size (0 = disabled)</p>
          </div>

          {/* Beam Search Settings */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Beam Search Settings</h4>

            {/* Number of Beams */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Number of Beams
                </label>
                <span className="text-sm font-semibold text-primary">{genSettings.numBeams}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={genSettings.numBeams}
                onChange={(e) => handleSettingChange('numBeams', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="mt-1 text-xs text-slate-500">Number of beams for beam search (1 = greedy, higher = better quality but slower)</p>
            </div>

            {/* Length Penalty - Only visible when beam search is enabled */}
            {genSettings.numBeams > 1 && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Length Penalty
                    </label>
                    <span className="text-sm font-semibold text-primary">{genSettings.lengthPenalty.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={genSettings.lengthPenalty}
                    onChange={(e) => handleSettingChange('lengthPenalty', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="mt-1 text-xs text-slate-500">Exponential penalty for length (&lt;1.0 = shorter, &gt;1.0 = longer)</p>
                </div>

                {/* Early Stopping */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Early Stopping
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Stop when numBeams complete sequences are generated</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('earlyStopping', !genSettings.earlyStopping)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      genSettings.earlyStopping ? 'bg-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        genSettings.earlyStopping ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tips for the extra content issue */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>{t('aiSettings.tip')}:</strong> {t('aiSettings.extraContentTip')}
          </p>
        </div>
      </div>
    </div>
  );
}
