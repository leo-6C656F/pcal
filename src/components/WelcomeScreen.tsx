import { UserPlus, Calendar, FileText } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

/**
 * WelcomeScreen Component
 * Shows first-time users how to get started
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl mb-6">
          <Calendar size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Welcome to PCAL!
        </h1>
        <p className="text-lg text-slate-600">
          Track parent-child activities for Head Start programs
        </p>
      </div>

      {/* 3-Step Guide */}
      <div className="space-y-6 mb-12">
        <div className="flex gap-6 items-start p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">1</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus size={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Add a Child</h3>
            </div>
            <p className="text-slate-600">
              Start by creating a profile with the child's name, center, and teacher information.
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">2</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Log Daily Activities</h3>
            </div>
            <p className="text-slate-600">
              Record what activities you did together, which goals you worked on, and how long you spent.
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">3</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Export Your Report</h3>
            </div>
            <p className="text-slate-600">
              When you're done, export a PDF report to share with your Head Start program.
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-indigo-900 mb-3">✓ Good to Know</h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Works offline</strong> - No internet connection needed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Your data stays private</strong> - Everything is saved on your device only</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Easy to use</strong> - Simple forms and helpful prompts guide you through</span>
          </li>
        </ul>
      </div>

      {/* Get Started Button */}
      <button
        onClick={onGetStarted}
        className="w-full btn-primary py-4 text-lg shadow-lg shadow-indigo-200 hover:shadow-xl"
      >
        Get Started
      </button>
    </div>
  );
}
