import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('timeInput.durationMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode('start-end')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            mode === 'start-end'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('timeInput.startEndMode')}
        </button>
      </div>

      {/* Time Inputs */}
      {mode === 'start-duration' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div>
              <label className="label-text text-xs block mb-1">{t('timeInput.start')}</label>
              <input
                type="time"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="input-field py-2.5 w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="label-text text-xs block mb-1">{t('timeInput.durationMin')}</label>
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
            <label className="label-text text-xs block mb-2 flex items-center gap-2">
              ⚡ {t('timeInput.quickSelect')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange(15)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 15
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                {t('timeInput.fifteenMin')}
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(30)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 30
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                {t('timeInput.thirtyMin')}
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(60)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 60
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                {t('timeInput.oneHour')}
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(120)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  localDuration === 120
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                {t('timeInput.twoHours')}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-slate-300" />
          </div>

          {/* End Time (calculated) */}
          <div>
            <label className="label-text text-xs block mb-1 text-slate-400">{t('timeInput.endTimeCalculated')}</label>
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
              <label className="label-text text-xs block mb-1">{t('timeInput.start')}</label>
              <input
                type="time"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="input-field py-2.5 w-full"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="label-text text-xs block mb-1">{t('timeInput.end')}</label>
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
            <label className="label-text text-xs block mb-1 text-slate-400">{t('timeInput.durationCalculated')}</label>
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
