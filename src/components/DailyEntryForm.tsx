import { useState } from 'react';
import { useStore } from '../store';
import { GoalSelector } from './GoalSelector';
import { TimeInput } from './TimeInput';
import { SignaturePad } from './SignaturePad';
import { PDFPreview } from './PDFPreview';
import type { ActivityLine } from '../types';
import { Trash2, Plus, Sparkles } from 'lucide-react';

/**
 * DailyEntryForm Component
 * Main form for creating and editing daily activity logs
 */
export function DailyEntryForm() {
  const {
    currentEntry,
    currentChild,
    addActivityLine,
    deleteActivityLine,
    saveSignature,
    generateAISummary
  } = useStore();

  // Form state for new activity line
  const [newLine, setNewLine] = useState<Partial<ActivityLine>>({
    goalCode: 1,
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
      <div className="text-center py-12">
        <p className="text-gray-500">Please select or create a daily entry</p>
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Activity Log for {currentChild.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Date: {currentEntry.date} | Center: {currentChild.center} | Teacher: {currentChild.teacher}
        </p>
      </div>

      {/* Add New Activity Line */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Activity</h2>

        <div className="space-y-4">
          {/* Goal Selector */}
          <GoalSelector
            selectedGoalCode={newLine.goalCode || 1}
            selectedActivities={newLine.selectedActivities || []}
            onGoalChange={(goalCode) => setNewLine({ ...newLine, goalCode })}
            onActivitiesChange={(activities) => setNewLine({ ...newLine, selectedActivities: activities })}
          />

          {/* Custom Narrative */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Narrative (Optional)
            </label>
            <textarea
              value={newLine.customNarrative || ''}
              onChange={(e) => setNewLine({ ...newLine, customNarrative: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes about this activity..."
            />
          </div>

          {/* Time Input */}
          <TimeInput
            startTime={newLine.startTime || '09:00'}
            endTime={newLine.endTime || '09:30'}
            durationMinutes={newLine.durationMinutes || 30}
            onChange={(data) => setNewLine({ ...newLine, ...data })}
          />

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddLine}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} />
            Add Activity
          </button>
        </div>
      </div>

      {/* Activity Lines List */}
      {currentEntry.lines.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Activities ({currentEntry.lines.length})
            </h2>
            <div className="text-sm text-gray-600">
              Total: {totalHours} hours
            </div>
          </div>

          <div className="space-y-3">
            {currentEntry.lines.map((line) => (
              <div key={line.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Goal {line.goalCode}
                      </span>
                      <span className="text-sm text-gray-600">
                        {line.startTime} - {line.endTime} ({line.durationMinutes} min)
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {line.customNarrative || line.selectedActivities.join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteActivityLine(currentEntry.id, line.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {currentEntry.lines.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
            <button
              type="button"
              onClick={handleGenerateAISummary}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {isGeneratingAI ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>

          {currentEntry.aiSummary && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <p className="text-sm text-gray-900">{currentEntry.aiSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature */}
      <div className="bg-white shadow rounded-lg p-6">
        <SignaturePad
          signatureBase64={currentEntry.signatureBase64}
          onSave={(signature) => saveSignature(currentEntry.id, signature)}
        />
      </div>

      {/* PDF Export */}
      {currentEntry.lines.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Export PDF</h2>
            <button
              type="button"
              onClick={() => setShowPDFPreview(!showPDFPreview)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showPDFPreview ? 'Hide' : 'Show'} PDF Preview
            </button>
          </div>

          {showPDFPreview && (
            <PDFPreview
              entry={currentEntry}
              child={currentChild}
              centerName={currentChild.center}
              teacherName={currentChild.teacher}
            />
          )}
        </div>
      )}
    </div>
  );
}
