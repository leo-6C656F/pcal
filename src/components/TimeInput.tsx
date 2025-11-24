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
      {mode === 'start-duration' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div>
              <label className="label-text text-xs block mb-1">Start</label>
              <input
                type="time"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="input-field py-2.5 w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="label-text text-xs block mb-1">Duration (Min)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={localDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="input-field py-2.5 w-full text-center"
              />
            </div>
          </div>

          {/* Quick Duration Presets */}
          <div>
            <label className="label-text text-xs block mb-2">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange(15)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 15
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                15 min
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(30)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 30
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                30 min
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(60)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 60
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                1 hour
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-slate-300" />
          </div>

          {/* End Time (calculated) */}
          <div>
            <label className="label-text text-xs block mb-1 text-slate-400">End Time (Calculated)</label>
            <input
              type="time"
              value={localEnd}
              disabled
              className="input-field bg-slate-100 text-slate-500 border-slate-200 py-2.5 w-full"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div>
              <label className="label-text text-xs block mb-1">Start</label>
              <input
                type="time"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="input-field py-2.5 w-full"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="label-text text-xs block mb-1">End</label>
              <input
                type="time"
                value={localEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="input-field py-2.5 w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-slate-300" />
          </div>

          {/* Duration (calculated) */}
          <div>
            <label className="label-text text-xs block mb-1 text-slate-400">Duration (Calculated)</label>
            <input
              type="number"
              value={localDuration}
              disabled
              className="input-field bg-slate-100 text-slate-500 border-slate-200 py-2.5 w-full text-center"
            />
          </div>
        </div>
      )}
    </div>
  );
}
