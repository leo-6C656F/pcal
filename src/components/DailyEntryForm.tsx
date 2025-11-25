import { useState } from 'react';
import { useStore } from '../store';
import { GoalSelector } from './GoalSelector';
import { TimeInput } from './TimeInput';
import { SignaturePad } from './SignaturePad';
import { PDFPreview } from './PDFPreview';
import { ConfirmDialog } from './ConfirmDialog';
import { HelpTooltip } from './HelpTooltip';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { ActivityLine } from '../types';
import { Trash2, Plus, Sparkles, Clock, BookOpen, Edit3, Keyboard, Lightbulb } from 'lucide-react';
import { getGoalColors, getGoalIcon } from '../utils/goalColors';
import { showToast } from '../App';

/**
 * DailyEntryForm Component
 * Main form for creating and editing daily activity logs
 */
export function DailyEntryForm() {
  const {
    currentEntry,
    currentChild,
    children,
    goals,
    addActivityLine,
    deleteActivityLine,
    saveSignature,
    generateAISummary,
    setCurrentChild,
    setCurrentEntry
  } = useStore();

  const getDefaultStartTime = () => {
    // Auto-suggest: Use the end time of the last activity as the start time for the next one
    if (currentEntry && currentEntry.lines.length > 0) {
      const lastLine = currentEntry.lines[currentEntry.lines.length - 1];
      return lastLine.endTime;
    }
    return '09:00';
  };

  const [newLine, setNewLine] = useState<Partial<ActivityLine>>({
    goalCode: goals[0]?.code || 1,
    selectedActivities: [],
    customNarrative: '',
    startTime: getDefaultStartTime(),
    endTime: '09:30',
    durationMinutes: 30
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ lineId: string; activity: string } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  if (!currentEntry || !currentChild) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select or create a daily entry</p>
      </div>
    );
  }

  const handleAddLine = async () => {
    if (!newLine.goalCode) return;

    setIsAddingActivity(true);
    try {
      await addActivityLine(currentEntry.id, {
        goalCode: newLine.goalCode,
        selectedActivities: newLine.selectedActivities || [],
        customNarrative: newLine.customNarrative || '',
        startTime: newLine.startTime || '09:00',
        endTime: newLine.endTime || '09:30',
        durationMinutes: newLine.durationMinutes || 30
      });

      // Reset form with smart time suggestion
      const nextStartTime = newLine.endTime || '09:00';
      setNewLine({
        goalCode: 1,
        selectedActivities: [],
        customNarrative: '',
        startTime: nextStartTime,
        endTime: '09:30',
        durationMinutes: 30
      });

      showToast?.success('Activity added successfully!');
    } catch (error) {
      console.error('Failed to add activity:', error);
      showToast?.error('Failed to add activity. Please try again.');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      await generateAISummary(currentEntry.id);
      showToast?.success('AI summary generated successfully!');
    } catch (error) {
      showToast?.error('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const totalMinutes = currentEntry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const handleChildSwitch = (childId: string) => {
    const newChild = children.find(c => c.id === childId);
    if (newChild) {
      setCurrentChild(newChild);
      setCurrentEntry(null);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrl: true,
      action: handleAddLine,
      description: 'Add activity (Ctrl+Enter)',
    },
    {
      key: 'Escape',
      action: () => {
        if (showShortcuts) setShowShortcuts(false);
        else if (deleteConfirm) setDeleteConfirm(null);
      },
      description: 'Close dialog (Esc)',
    },
    {
      key: '?',
      shift: true,
      action: () => setShowShortcuts(!showShortcuts),
      description: 'Show shortcuts (Shift+?)',
    },
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-md w-full p-6 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Keyboard size={20} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Keyboard Shortcuts</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Add Activity</span>
                <kbd className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">Ctrl + Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Close Dialog</span>
                <kbd className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">Esc</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Show This Help</span>
                <kbd className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">Shift + ?</kbd>
              </div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="btn-primary w-full mt-4">
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Activity?"
          message={`Are you sure you want to remove "${deleteConfirm.activity}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Keep It"
          variant="danger"
          onConfirm={() => {
            deleteActivityLine(currentEntry.id, deleteConfirm.lineId);
            showToast?.info('Activity removed');
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="card p-6 border-l-4 border-l-indigo-500">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Activity Log:
              </h1>
              {children.length > 1 ? (
                <select
                  value={currentChild.id}
                  onChange={(e) => handleChildSwitch(e.target.value)}
                  className="text-2xl font-bold text-indigo-600 bg-transparent border-b-2 border-indigo-200 hover:border-indigo-400 focus:outline-none focus:border-indigo-600 cursor-pointer transition-colors px-2 py-1"
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-2xl font-bold text-indigo-600">{currentChild.name}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-700">
                Date: {currentEntry.date}
              </span>
              <span>Center: {currentChild.center}</span>
              <span>Teacher: {currentChild.teacher}</span>
            </div>
          </div>
          <div className="text-right space-y-2">
             <div className="text-3xl font-bold text-indigo-600">{totalHours}</div>
             <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Hours</div>
             {/* Visual Progress Bar */}
             <div className="w-32">
               <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                 <div
                   className={`h-full rounded-full transition-all duration-500 ${
                     totalMinutes >= 480 ? 'bg-green-500' : totalMinutes >= 240 ? 'bg-indigo-500' : 'bg-amber-500'
                   }`}
                   style={{ width: `${Math.min((totalMinutes / 480) * 100, 100)}%` }}
                 />
               </div>
               <div className="text-xs text-slate-400 mt-1 text-center">
                 {Math.round((totalMinutes / 480) * 100)}% of 8hrs
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Add Activity Form */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Tips for First Entry */}
          {currentEntry.lines.length === 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 animate-bounce-in">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Lightbulb size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Quick Tips</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>1️⃣ Pick a <strong>goal</strong> you worked on</li>
                    <li>2️⃣ Choose <strong>activities</strong> you did</li>
                    <li>3️⃣ Add <strong>time spent</strong> together</li>
                    <li>4️⃣ Click "Add Activity" to save!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 shadow-md border-indigo-100 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Plus size={18} />
              </div>
              Log Activity
              <HelpTooltip content="Record what you and your child did together. You can add multiple activities for the same day!" />
            </h2>

            <div className="space-y-6">
              {/* Goal Selector */}
              <div className="space-y-2">
                <GoalSelector
                  selectedGoalCode={newLine.goalCode || 1}
                  selectedActivities={newLine.selectedActivities || []}
                  onGoalChange={(goalCode) => {
                    console.log('=== GOAL CHANGE ===');
                    console.log('New goal code:', goalCode);
                    setNewLine(prev => {
                      console.log('Previous state:', prev);
                      const newState = { ...prev, goalCode, selectedActivities: [] };
                      console.log('New state:', newState);
                      return newState;
                    });
                  }}
                  onActivitiesChange={(activities) => {
                    console.log('=== ACTIVITIES CHANGE (from parent) ===');
                    console.log('New activities:', activities);
                    setNewLine(prev => {
                      console.log('Previous state:', prev);
                      const newState = { ...prev, selectedActivities: activities };
                      console.log('New state:', newState);
                      return newState;
                    });
                  }}
                />
              </div>

              {/* Custom Narrative */}
              <div>
                <label className="label-text flex items-center gap-2">
                  <Edit3 size={14} />
                  Add Your Own Notes (Optional)
                  <HelpTooltip content="Describe what you did in your own words. This is optional if you already selected activities above." />
                </label>
                <textarea
                  value={newLine.customNarrative || ''}
                  onChange={(e) => setNewLine({ ...newLine, customNarrative: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Example: We read a book about animals and talked about what sounds they make..."
                />
              </div>

              {/* Time Input */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <TimeInput
                  startTime={newLine.startTime || '09:00'}
                  endTime={newLine.endTime || '09:30'}
                  durationMinutes={newLine.durationMinutes || 30}
                  onChange={(data) => setNewLine({ ...newLine, ...data })}
                />
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddLine}
                className="w-full btn-primary py-3 text-base shadow-indigo-200"
                disabled={isAddingActivity}
              >
                {isAddingActivity ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Activity to Log'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: List & Actions */}
        <div className="xl:col-span-2 space-y-8">
          {/* Activity Lines List */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-500" />
                Logged Activities
                <span className="ml-2 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  {currentEntry.lines.length}
                </span>
              </h2>
            </div>

            {currentEntry.lines.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">No activities logged yet.</p>
                <p className="text-sm text-slate-400">Use the form to add your first activity.</p>
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
                              Goal {line.goalCode}
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
                        <button
                          type="button"
                          onClick={() => {
                            const activityDesc = line.customNarrative || line.selectedActivities.join(', ') || 'this activity';
                            setDeleteConfirm({ lineId: line.id, activity: activityDesc });
                          }}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Activity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {currentEntry.lines.length > 0 && (
            <div className="card p-6 bg-gradient-to-br from-white to-purple-50 border-purple-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  Day Summary
                  <HelpTooltip content="This creates a written summary of all your activities for the day. Great for reports and documentation!" />
                </h2>
                <button
                  type="button"
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingAI}
                  className="btn-secondary border-purple-200 text-purple-700 hover:bg-purple-50 focus:ring-purple-500"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-700 border-t-transparent mr-2"></div>
                      Writing...
                    </>
                  ) : (
                    '✨ Write Summary'
                  )}
                </button>
              </div>

              {currentEntry.aiSummary ? (
                <div className="bg-white/80 p-5 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-slate-700 leading-relaxed">{currentEntry.aiSummary}</p>
                </div>
              ) : (
                <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-4">
                  <p className="text-sm text-purple-700">
                    💡 <strong>Tip:</strong> Click "Write Summary" to automatically create a professional description of today's activities.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Signature Section */}
          <div className="card p-6">
            <SignaturePad
              signatureBase64={currentEntry.signatureBase64}
              onSave={(signature) => saveSignature(currentEntry.id, signature)}
            />
          </div>

          {/* PDF Export Section */}
          {currentEntry.lines.length > 0 && (
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Finalize & Export</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Review the document and download the official Head Start PDF form.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPDFPreview(!showPDFPreview)}
                  className="btn-secondary whitespace-nowrap"
                >
                  {showPDFPreview ? 'Hide Preview' : 'Preview PDF'}
                </button>
              </div>

              {showPDFPreview && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <PDFPreview
                    entries={[currentEntry]}
                    child={currentChild}
                    centerName={currentChild.center}
                    teacherName={currentChild.teacher}
                    goals={goals}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
