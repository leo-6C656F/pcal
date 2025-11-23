import { useState } from 'react';
import { useStore } from '../store';
import { GoalSelector } from './GoalSelector';
import { TimeInput } from './TimeInput';
import { SignaturePad } from './SignaturePad';
import { PDFPreview } from './PDFPreview';
import type { ActivityLine } from '../types';
import { Trash2, Plus, Sparkles, Clock, BookOpen, Edit3 } from 'lucide-react';

/**
 * DailyEntryForm Component
 * Main form for creating and editing daily activity logs
 */
export function DailyEntryForm() {
  const {
    currentEntry,
    currentChild,
    goals,
    addActivityLine,
    deleteActivityLine,
    saveSignature,
    generateAISummary
  } = useStore();

  const [newLine, setNewLine] = useState<Partial<ActivityLine>>({
    goalCode: goals[0]?.code || 1,
    selectedActivities: [],
    customNarrative: '',
    startTime: '09:00',
    endTime: '09:30',
    durationMinutes: 30
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  if (!currentEntry || !currentChild) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Please select or create a daily entry</p>
      </div>
    );
  }

  const handleAddLine = async () => {
    if (!newLine.goalCode) return;

    await addActivityLine(currentEntry.id, {
      goalCode: newLine.goalCode,
      selectedActivities: newLine.selectedActivities || [],
      customNarrative: newLine.customNarrative || '',
      startTime: newLine.startTime || '09:00',
      endTime: newLine.endTime || '09:30',
      durationMinutes: newLine.durationMinutes || 30
    });

    // Reset form
    setNewLine({
      goalCode: 1,
      selectedActivities: [],
      customNarrative: '',
      startTime: '09:00',
      endTime: '09:30',
      durationMinutes: 30
    });
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      await generateAISummary(currentEntry.id);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const totalMinutes = currentEntry.lines.reduce((sum, line) => sum + line.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="card p-6 border-l-4 border-l-indigo-500">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Activity Log: {currentChild.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-700">
                Date: {currentEntry.date}
              </span>
              <span>Center: {currentChild.center}</span>
              <span>Teacher: {currentChild.teacher}</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-3xl font-bold text-indigo-600">{totalHours}</div>
             <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Hours</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Add Activity Form */}
        <div className="xl:col-span-1 space-y-6">
          <div className="card p-6 shadow-md border-indigo-100 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Plus size={18} />
              </div>
              Log Activity
            </h2>

            <div className="space-y-6">
              {/* Goal Selector */}
              <div className="space-y-2">
                <GoalSelector
                  selectedGoalCode={newLine.goalCode || 1}
                  selectedActivities={newLine.selectedActivities || []}
                  onGoalChange={(goalCode) => setNewLine({ ...newLine, goalCode })}
                  onActivitiesChange={(activities) => setNewLine({ ...newLine, selectedActivities: activities })}
                />
              </div>

              {/* Custom Narrative */}
              <div>
                <label className="label-text flex items-center gap-2">
                  <Edit3 size={14} />
                  Notes / Narrative
                </label>
                <textarea
                  value={newLine.customNarrative || ''}
                  onChange={(e) => setNewLine({ ...newLine, customNarrative: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="What did you do together?"
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
              >
                Add Activity to Log
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
                {currentEntry.lines.map((line) => (
                  <div key={line.id} className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
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
                        onClick={() => deleteActivityLine(currentEntry.id, line.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {currentEntry.lines.length > 0 && (
            <div className="card p-6 bg-gradient-to-br from-white to-purple-50 border-purple-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  AI Summary
                </h2>
                <button
                  type="button"
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingAI}
                  className="btn-secondary border-purple-200 text-purple-700 hover:bg-purple-50 focus:ring-purple-500"
                >
                  {isGeneratingAI ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>

              {currentEntry.aiSummary ? (
                <div className="bg-white/80 p-5 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-slate-700 leading-relaxed">{currentEntry.aiSummary}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Generate a narrative summary of the day's activities using AI.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Signature */}
            <div className="card p-6">
              <SignaturePad
                signatureBase64={currentEntry.signatureBase64}
                onSave={(signature) => saveSignature(currentEntry.id, signature)}
              />
            </div>

            {/* PDF Export */}
            {currentEntry.lines.length > 0 && (
              <div className="card p-6 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Finalize & Export</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Review the document and download the official Head Start PDF form.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPDFPreview(!showPDFPreview)}
                  className="btn-secondary w-full"
                >
                  {showPDFPreview ? 'Hide Preview' : 'Preview PDF'}
                </button>

                {showPDFPreview && (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
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
    </div>
  );
}
