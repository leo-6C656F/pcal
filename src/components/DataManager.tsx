import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Database, AlertTriangle, CheckCircle, FileJson, Loader2 } from 'lucide-react';
import { downloadExport, importData, parseImportFile, getDataStats, type ImportMode, type ExportData } from '../services/dataExportImport';
import { showToast } from '../App';
import { useStore } from '../store';

/**
 * DataManager Component
 * Handles data export and import functionality
 */
export function DataManager() {
  const { t } = useTranslation();
  const { loadChildren, loadEntries, loadGoals } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<{
    children: number;
    entries: number;
    goals: number;
    journalEvents: number;
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExportData | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [includeOpenAI, setIncludeOpenAI] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const currentStats = await getDataStats();
    setStats(currentStats);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadExport(includeOpenAI);
      showToast.success(t('dataManager.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      showToast.error(t('dataManager.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError(null);
    setImportPreview(null);

    const result = await parseImportFile(file);
    if (result.valid && result.data) {
      setImportPreview(result.data);
    } else {
      setImportError(result.error || t('dataManager.invalidFile'));
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;

    setConfirmingImport(false);
    setIsImporting(true);

    try {
      const result = await importData(selectedFile, importMode);

      if (result.success) {
        showToast.success(result.message);
        // Reload all data into the store
        await Promise.all([loadChildren(), loadEntries(), loadGoals()]);
        await loadStats();
        // Clear the import state
        setSelectedFile(null);
        setImportPreview(null);
      } else {
        showToast.error(result.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast.error(t('dataManager.importError'));
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setSelectedFile(null);
    setImportPreview(null);
    setImportError(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('dataManager.title')}</h1>
        <p className="text-slate-500 mt-1">{t('dataManager.subtitle')}</p>
      </div>

      {/* Current Data Stats */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{t('dataManager.currentData')}</h2>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.children}</p>
              <p className="text-sm text-slate-500">{t('dataManager.children')}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.entries}</p>
              <p className="text-sm text-slate-500">{t('dataManager.entries')}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.goals}</p>
              <p className="text-sm text-slate-500">{t('dataManager.goals')}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.journalEvents}</p>
              <p className="text-sm text-slate-500">{t('dataManager.events')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Download size={20} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{t('dataManager.exportTitle')}</h2>
        </div>
        <p className="text-slate-600 mb-4">{t('dataManager.exportDescription')}</p>

        {/* Export Options */}
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOpenAI}
              onChange={(e) => setIncludeOpenAI(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Include OpenAI API Key</p>
              <p className="text-xs text-slate-500 mt-1">
                Export your OpenAI API configuration (key, model, base URL, and priority).
                This allows you to backup your API settings or transfer them to another device.
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-primary"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {t('dataManager.exporting')}
            </>
          ) : (
            <>
              <Download size={18} className="mr-2" />
              {t('dataManager.exportButton')}
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Upload size={20} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{t('dataManager.importTitle')}</h2>
        </div>
        <p className="text-slate-600 mb-4">{t('dataManager.importDescription')}</p>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!importPreview && !importError && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="btn-secondary"
          >
            <FileJson size={18} className="mr-2" />
            {t('dataManager.selectFile')}
          </button>
        )}

        {/* Import Error */}
        {importError && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-500 mt-0.5" size={20} />
              <div>
                <p className="text-rose-700 font-medium">{t('dataManager.invalidFile')}</p>
                <p className="text-rose-600 text-sm mt-1">{importError}</p>
                <button
                  onClick={cancelImport}
                  className="mt-3 text-sm text-rose-600 hover:text-rose-800 underline"
                >
                  {t('dataManager.tryAgain')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Preview */}
        {importPreview && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-emerald-500 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{t('dataManager.validFile')}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {t('dataManager.exportedOn')}: {formatDate(importPreview.exportedAt)}
                  </p>
                </div>
              </div>

              {/* Preview Stats */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-lg font-bold text-slate-900">{importPreview.data.children.length}</p>
                  <p className="text-xs text-slate-500">{t('dataManager.children')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-lg font-bold text-slate-900">{importPreview.data.dailyEntries.length}</p>
                  <p className="text-xs text-slate-500">{t('dataManager.entries')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-lg font-bold text-slate-900">{importPreview.data.goals.length}</p>
                  <p className="text-xs text-slate-500">{t('dataManager.goals')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-lg font-bold text-slate-900">{importPreview.data.journal.length}</p>
                  <p className="text-xs text-slate-500">{t('dataManager.events')}</p>
                </div>
              </div>

              {/* OpenAI Config Preview */}
              {importPreview.openAIConfig && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-blue-600" size={16} />
                    <p className="text-sm font-medium text-blue-900">
                      OpenAI API configuration included
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1 ml-6">
                    This backup contains OpenAI API settings (key, model: {importPreview.openAIConfig.openAIModel})
                  </p>
                </div>
              )}
            </div>

            {/* Import Mode Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">{t('dataManager.importModeLabel')}</p>

              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-slate-900">{t('dataManager.mergeMode')}</p>
                  <p className="text-sm text-slate-500">{t('dataManager.mergeModeDescription')}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-slate-900">{t('dataManager.replaceMode')}</p>
                  <p className="text-sm text-slate-500">{t('dataManager.replaceModeDescription')}</p>
                </div>
              </label>
            </div>

            {/* Warning for Replace Mode */}
            {importMode === 'replace' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 mt-0.5" size={20} />
                  <p className="text-amber-700 text-sm">{t('dataManager.replaceWarning')}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {confirmingImport ? (
                <div className={`flex items-center gap-3 p-3 rounded-lg border animate-in fade-in-0 zoom-in-95 duration-150 ${
                  importMode === 'replace'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <AlertTriangle size={18} className={importMode === 'replace' ? 'text-rose-600' : 'text-blue-600'} />
                  <span className={`text-sm flex-1 ${importMode === 'replace' ? 'text-rose-700' : 'text-blue-700'}`}>
                    {importMode === 'replace'
                      ? t('dataManager.confirmReplaceMessage')
                      : t('dataManager.confirmMergeMessage')}
                  </span>
                  <button
                    onClick={() => setConfirmingImport(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={isImporting}
                    className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 ${
                      importMode === 'replace'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isImporting ? t('dataManager.importing') : (importMode === 'replace' ? t('dataManager.replaceData') : t('dataManager.mergeData'))}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmingImport(true)}
                    disabled={isImporting}
                    className={importMode === 'replace' ? 'btn-danger' : 'btn-primary'}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        {t('dataManager.importing')}
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="mr-2" />
                        {importMode === 'replace' ? t('dataManager.replaceData') : t('dataManager.mergeData')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelImport}
                    disabled={isImporting}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
