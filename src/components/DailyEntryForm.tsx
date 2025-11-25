import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { GoalSelector } from './GoalSelector';
import { TimeInput } from './TimeInput';
import { SignaturePad } from './SignaturePad';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpTooltip } from './HelpTooltip';
import type { ActivityLine, ModelLoadingState } from '../types';
import { Trash2, Plus, Sparkles, Clock, BookOpen, Edit3, ArrowLeft, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { getGoalColors, getGoalIcon } from '../utils/goalColors';
import { showToast } from '../App';
import { isModelReady, initializeModel } from '../services/aiService';

type View = 'list' | 'form' | 'finalize';

interface DailyEntryFormProps {
  subView: View;
  onSubViewChange: (view: View) => void;
}

/**
 * DailyEntryForm Component
 * Main form for creating and editing daily activity logs
 */
export function DailyEntryForm({ subView, onSubViewChange }: DailyEntryFormProps) {
  const { t } = useTranslation();
  const {
    currentEntry,
    currentChild,
    children,
    addActivityLine,
    updateActivityLine,
    deleteActivityLine,
    setCurrentChild,
    setCurrentEntry
  } = useStore();

  // Use subView prop from parent for browser history integration
  const view = subView;
  const setView = onSubViewChange;
  const [activityToEdit, setActivityToEdit] = useState<ActivityLine | null>(null);

  if (!currentEntry || !currentChild) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{t('dailyEntryForm.selectEntry')}</p>
      </div>
    );
  }

  const handleChildSwitch = (childId: string) => {
    const newChild = children.find(c => c.id === childId);
    if (newChild) {
      setCurrentChild(newChild);
      setCurrentEntry(null);
    }
  };

  const totalMinutes = currentEntry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const Header = () => (
    <div className="card p-6 border-l-4 border-l-primary">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {t('dailyEntryForm.activityLog')}
            </h1>
            {children.length > 1 ? (
              <select
                value={currentChild.id}
                onChange={(e) => handleChildSwitch(e.target.value)}
                className="text-2xl font-bold text-primary bg-transparent border-b-2 border-blue-200 hover:border-blue-400 focus:outline-none focus:border-primary cursor-pointer transition-colors px-2 py-1"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-2xl font-bold text-primary">{currentChild.name}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-700">
              {t('dailyEntryForm.date')} {currentEntry.date}
            </span>
            <span>{t('dailyEntryForm.center')} {currentChild.center}</span>
            <span>{t('dailyEntryForm.teacher')} {currentChild.teacher}</span>
          </div>
        </div>
        <div className="text-right space-y-2">
           <div className="text-3xl font-bold text-primary">{totalHours}</div>
           <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('dailyEntryForm.totalHours')}</div>
           <div className="w-32">
             <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
               <div
                 className={`h-full rounded-full transition-all duration-500 ${
                   totalMinutes >= 480 ? 'bg-green-500' : totalMinutes >= 240 ? 'bg-primary' : 'bg-amber-500'
                 }`}
                 style={{ width: `${Math.min((totalMinutes / 480) * 100, 100)}%` }}
               />
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const ActivityList = ({ onAdd, onEdit, onFinalize }: {
    onAdd: () => void;
    onEdit: (activity: ActivityLine) => void;
    onFinalize: () => void;
  }) => {
    const [deleteConfirm, setDeleteConfirm] = useState<{ lineId: string; activity: string } | null>(null);

    if (!currentEntry) return null;

    return (
      <>
        {deleteConfirm && (
          <ConfirmDialog
            title={t('dailyEntryForm.deleteActivityTitle')}
            message={t('dailyEntryForm.deleteActivityMessage', { activity: deleteConfirm.activity })}
            confirmText={t('common.delete')}
            cancelText={t('dailyEntryForm.keepIt')}
            variant="danger"
            onConfirm={() => {
              deleteActivityLine(currentEntry.id, deleteConfirm.lineId);
              showToast?.info(t('toast.activityRemoved'));
              setDeleteConfirm(null);
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              {t('dailyEntryForm.loggedActivities')}
              <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-primary text-xs rounded-full">
                {currentEntry.lines.length}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAdd}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                {t('dailyEntryForm.addNewActivity')}
              </button>
              <button
                type="button"
                onClick={onFinalize}
                className="btn-secondary"
                disabled={currentEntry.lines.length === 0}
              >
                <CheckCircle size={18} className="mr-2" />
                {t('dailyEntryForm.reviewFinalize')}
              </button>
            </div>
          </div>

          {currentEntry.lines.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500">{t('dailyEntryForm.noActivities')}</p>
              <p className="text-sm text-slate-400">{t('dailyEntryForm.noActivitiesHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentEntry.lines.map((line) => {
                const colors = getGoalColors(line.goalCode);
                return (
                  <div key={line.id} className={`group bg-white border-2 ${colors.border} rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors.badge} gap-1`}>
                            <span>{getGoalIcon(line.goalCode)}</span>
                            {t('common.goal')} {line.goalCode}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 gap-1">
                            <Clock size={12} />
                            {line.startTime} - {line.endTime}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({line.durationMinutes} min)
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {line.customNarrative || line.selectedActivities.join(', ')}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(line)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('dailyEntryForm.editActivity')}
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const activityDesc = line.customNarrative || line.selectedActivities.join(', ') || t('common.activity');
                            setDeleteConfirm({ lineId: line.id, activity: activityDesc });
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t('dailyEntryForm.deleteActivity')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };
  const ActivityForm = ({ activity, onClose }: {
    activity: ActivityLine | null;
    onClose: () => void;
  }) => {
    const { currentEntry, goals } = useStore();

    const getDefaultStartTime = () => {
      if (currentEntry && currentEntry.lines.length > 0) {
        const lastLine = currentEntry.lines[currentEntry.lines.length - 1];
        return lastLine.endTime;
      }
      return '09:00';
    };

    const [line, setLine] = useState<Partial<ActivityLine>>(
      activity || {
        goalCode: goals[0]?.code || 1,
        selectedActivities: [],
        customNarrative: '',
        startTime: getDefaultStartTime(),
        endTime: '09:30',
        durationMinutes: 30
      }
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      if (!line.goalCode) return;

      setIsSaving(true);
      try {
        if (activity?.id) { // Editing existing activity
          await updateActivityLine(currentEntry!.id, activity.id, line);
          showToast?.success(t('toast.activityUpdated'));
        } else { // Adding new activity
          await addActivityLine(currentEntry!.id, {
            goalCode: line.goalCode,
            selectedActivities: line.selectedActivities || [],
            customNarrative: line.customNarrative || '',
            startTime: line.startTime || '09:00',
            endTime: line.endTime || '09:30',
            durationMinutes: line.durationMinutes || 30
          });
          showToast?.success(t('toast.activityAdded'));
        }
        onClose();
      } catch (error) {
        console.error('Failed to save activity:', error);
        showToast?.error(t('toast.activitySaveFailed'));
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-lg animate-slide-in-from-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {activity ? <Edit3 size={18} /> : <Plus size={18} />}
                {activity ? t('dailyEntryForm.editActivity') : t('dailyEntryForm.addActivity')}
              </h2>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <GoalSelector
                  selectedGoalCode={line.goalCode || 1}
                  selectedActivities={line.selectedActivities || []}
                  onGoalChange={(goalCode) => setLine(prev => ({ ...prev, goalCode, selectedActivities: [] }))}
                  onActivitiesChange={(activities) => setLine(prev => ({ ...prev, selectedActivities: activities }))}
                />
              </div>

              <div>
                <label className="label-text flex items-center gap-2">
                  <Edit3 size={14} />
                  {t('dailyEntryForm.addNotes')}
                  <HelpTooltip content={t('dailyEntryForm.addNotesTooltip')} />
                </label>
                <textarea
                  value={line.customNarrative || ''}
                  onChange={(e) => setLine({ ...line, customNarrative: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder={t('dailyEntryForm.notesPlaceholder')}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <TimeInput
                  startTime={line.startTime || '09:00'}
                  endTime={line.endTime || '09:30'}
                  durationMinutes={line.durationMinutes || 30}
                  onChange={(data) => setLine({ ...line, ...data })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('common.saving')}
                  </>
                ) : (
                  t('dailyEntryForm.saveActivity')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const FinalizeSheet = ({ onClose }: { onClose: () => void }) => {
    const { currentEntry, saveSignature, generateAISummary } = useStore();
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isDownloadingModel, setIsDownloadingModel] = useState(false);
    const [hasAutoGenerated, setHasAutoGenerated] = useState(false);
    const [modelReady, setModelReady] = useState(() => isModelReady());
    const [modelLoadingState, setModelLoadingState] = useState<ModelLoadingState>({
      isLoading: false,
      progress: 0,
      status: ''
    });

    // Check model status on mount
    useEffect(() => {
      setModelReady(isModelReady());
    }, []);

    // Handle model download
    const handleDownloadModel = async () => {
      setIsDownloadingModel(true);
      try {
        const success = await initializeModel((state) => {
          setModelLoadingState(state);
        });
        if (success) {
          setModelReady(true);
          showToast?.success(t('dailyEntryForm.modelDownloaded'));
        }
      } catch (error) {
        console.error('Failed to download model:', error);
        showToast?.error(t('dailyEntryForm.modelDownloadFailed'));
      } finally {
        setIsDownloadingModel(false);
        setModelLoadingState({ isLoading: false, progress: 0, status: '' });
      }
    };

    // Auto-generate summary when entering finalize view (only if model is ready)
    useEffect(() => {
      const autoGenerateSummary = async () => {
        if (!currentEntry || hasAutoGenerated) return;
        if (currentEntry.aiSummary || currentEntry.lines.length === 0) return;
        if (!isModelReady()) return; // Don't auto-generate if model not ready

        setIsGeneratingAI(true);
        setHasAutoGenerated(true);
        try {
          await generateAISummary(currentEntry.id, setModelLoadingState);
        } catch (error) {
          console.error('Failed to auto-generate summary:', error);
        } finally {
          setIsGeneratingAI(false);
          setModelLoadingState({ isLoading: false, progress: 100, status: '' });
        }
      };

      autoGenerateSummary();
    }, [currentEntry, generateAISummary, hasAutoGenerated]);

    return (
      <div className="fixed inset-0 z-30 bg-white animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-primary hover:bg-blue-50 rounded-full transition-colors"
              aria-label={t('dailyEntryForm.backToActivityList')}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{t('dailyEntryForm.reviewFinalize')}</h2>
          </div>

          {/* AI Summary */}
          {currentEntry && currentEntry.lines.length > 0 && (
            <div className="card p-6 bg-gradient-to-br from-white to-purple-50 border-purple-100">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  {t('dailyEntryForm.daySummary')}
                  <HelpTooltip content={t('dailyEntryForm.daySummaryTooltip')} />
                </h2>
                {currentEntry.aiSummary && !isGeneratingAI && (
                  <button
                    onClick={async () => {
                      setIsGeneratingAI(true);
                      try {
                        await generateAISummary(currentEntry.id, setModelLoadingState);
                      } catch (error) {
                        console.error('Failed to regenerate summary:', error);
                      } finally {
                        setIsGeneratingAI(false);
                        setModelLoadingState({ isLoading: false, progress: 100, status: '' });
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <RefreshCw size={16} />
                    {t('dailyEntryForm.regenerate')}
                  </button>
                )}
              </div>

              {isDownloadingModel ? (
                <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-purple-700 border-t-transparent"></div>
                    <p className="text-sm text-purple-700 font-medium">
                      {modelLoadingState.status || t('dailyEntryForm.downloadingModel')}
                    </p>
                  </div>
                  {modelLoadingState.progress > 0 && (
                    <div className="w-full max-w-xs mx-auto">
                      <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${modelLoadingState.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-purple-500 text-center mt-1">
                        {modelLoadingState.progress}%
                      </p>
                    </div>
                  )}
                </div>
              ) : isGeneratingAI ? (
                <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-700 border-t-transparent"></div>
                    <p className="text-sm text-purple-700 font-medium">
                      {t('dailyEntryForm.generatingSummary')}
                    </p>
                  </div>
                </div>
              ) : currentEntry.aiSummary ? (
                <div className="bg-white/80 p-5 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-slate-700 leading-relaxed">{currentEntry.aiSummary}</p>
                </div>
              ) : !modelReady ? (
                <button
                  onClick={handleDownloadModel}
                  className="w-full bg-purple-50 border-2 border-dashed border-purple-300 rounded-xl p-5 hover:bg-purple-100 hover:border-purple-400 transition-colors group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Download size={20} className="text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-purple-700">
                      {t('dailyEntryForm.downloadModelPrompt')}
                    </p>
                    <p className="text-xs text-purple-500">
                      {t('dailyEntryForm.downloadModelSize')}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setIsGeneratingAI(true);
                    try {
                      await generateAISummary(currentEntry.id, setModelLoadingState);
                    } catch (error) {
                      console.error('Failed to generate summary:', error);
                    } finally {
                      setIsGeneratingAI(false);
                    }
                  }}
                  className="w-full bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-4 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">
                      {t('dailyEntryForm.generateSummary')}
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Signature Section */}
          <div className="card p-6">
            <SignaturePad
              signatureBase64={currentEntry?.signatureBase64}
              onSave={(signature) => currentEntry && saveSignature(currentEntry.id, signature)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <Header />

      {view === 'list' && (
        <ActivityList
          onAdd={() => { setActivityToEdit(null); setView('form'); }}
          onEdit={(activity) => { setActivityToEdit(activity); setView('form'); }}
          onFinalize={() => setView('finalize')}
        />
      )}

      {view === 'form' && (
        <ActivityForm
          activity={activityToEdit}
          onClose={() => setView('list')}
        />
      )}

      {view === 'finalize' && (
        <FinalizeSheet onClose={() => setView('list')} />
      )}
    </div>
  );
}
