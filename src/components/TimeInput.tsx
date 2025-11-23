import { useState, useEffect } from 'react';
import { calculateTimeFields } from '../store';
import type { TimeInputMode } from '../types';

interface TimeInputProps {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  onChange: (data: { startTime: string; endTime: string; durationMinutes: number }) => void;
}

/**
 * TimeInput Component
 * Supports two modes:
 * 1. Start + Duration -> End (calculated)
 * 2. Start + End -> Duration (calculated)
 */
export function TimeInput({ startTime, endTime, durationMinutes, onChange }: TimeInputProps) {
  const [mode, setMode] = useState<TimeInputMode>('start-duration');
  const [localStart, setLocalStart] = useState(startTime);
  const [localEnd, setLocalEnd] = useState(endTime);
  const [localDuration, setLocalDuration] = useState(durationMinutes);

  useEffect(() => {
    setLocalStart(startTime);
    setLocalEnd(endTime);
    setLocalDuration(durationMinutes);
  }, [startTime, endTime, durationMinutes]);

  const handleStartChange = (value: string) => {
    setLocalStart(value);

    if (mode === 'start-duration') {
      const result = calculateTimeFields(value, undefined, localDuration);
      onChange(result);
    } else {
      const result = calculateTimeFields(value, localEnd);
      onChange(result);
    }
  };

  const handleEndChange = (value: string) => {
    setLocalEnd(value);
    const result = calculateTimeFields(localStart, value);
    onChange(result);
  };

  const handleDurationChange = (value: number) => {
    setLocalDuration(value);
    const result = calculateTimeFields(localStart, undefined, value);
    onChange(result);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('start-duration')}
          className={`px-3 py-1 text-sm rounded-md ${
            mode === 'start-duration'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Start + Duration
        </button>
        <button
          type="button"
          onClick={() => setMode('start-end')}
          className={`px-3 py-1 text-sm rounded-md ${
            mode === 'start-end'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Start + End
        </button>
      </div>

      {/* Time Inputs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Start Time - Always shown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={localStart}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Mode-dependent input */}
        {mode === 'start-duration' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={localDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
                <span className="text-xs text-gray-500 ml-1">(calculated)</span>
              </label>
              <input
                type="time"
                value={localEnd}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={localEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (min)
                <span className="text-xs text-gray-500 ml-1">(calculated)</span>
              </label>
              <input
                type="number"
                value={localDuration}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
              />
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
        <p className="text-sm text-gray-700">
          {localStart} to {localEnd} ({localDuration} minutes = {(localDuration / 60).toFixed(2)} hours)
        </p>
      </div>
    </div>
  );
}
