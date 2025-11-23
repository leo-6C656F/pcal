import { useState, useEffect } from 'react';
import { calculateTimeFields } from '../store';
import type { TimeInputMode } from '../types';
import { ArrowRight } from 'lucide-react';

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
      <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('start-duration')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            mode === 'start-duration'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Duration Mode
        </button>
        <button
          type="button"
          onClick={() => setMode('start-end')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            mode === 'start-end'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Start/End Mode
        </button>
      </div>

      {/* Time Inputs */}
      <div className="flex items-end gap-3">
        {/* Start Time - Always shown */}
        <div className="flex-1">
          <label className="label-text text-xs">Start</label>
          <input
            type="time"
            value={localStart}
            onChange={(e) => handleStartChange(e.target.value)}
            className="input-field py-2"
          />
        </div>

        {/* Mode-dependent input */}
        {mode === 'start-duration' ? (
          <>
            <div className="flex-1">
              <label className="label-text text-xs">Min</label>
              <input
                type="number"
                min="0"
                step="5"
                value={localDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="input-field py-2"
              />
            </div>
            <div className="pb-3 text-slate-300">
              <ArrowRight size={16} />
            </div>
            <div className="flex-1">
              <label className="label-text text-xs text-slate-400">End</label>
              <input
                type="time"
                value={localEnd}
                disabled
                className="input-field bg-slate-100 text-slate-500 border-slate-200 py-2"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex-1">
              <label className="label-text text-xs">End</label>
              <input
                type="time"
                value={localEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="input-field py-2"
              />
            </div>
            <div className="pb-3 text-slate-300">
              <ArrowRight size={16} />
            </div>
            <div className="flex-1">
              <label className="label-text text-xs text-slate-400">Min</label>
              <input
                type="number"
                value={localDuration}
                disabled
                className="input-field bg-slate-100 text-slate-500 border-slate-200 py-2"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
