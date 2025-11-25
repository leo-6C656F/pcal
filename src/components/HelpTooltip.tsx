import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ content, position = 'top' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-indigo-600 transition-colors ml-1.5"
        aria-label="Help"
      >
        <HelpCircle size={16} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 ${positionClasses[position]} w-64 animate-fade-in`}>
          <div className="bg-slate-900 text-white text-sm rounded-lg p-3 shadow-lg">
            <div className="relative">
              {content}
              {/* Arrow */}
              <div className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
