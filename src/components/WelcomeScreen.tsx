import { useTranslation } from 'react-i18next';
import { UserPlus, Calendar, FileText } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

/**
 * WelcomeScreen Component
 * Shows first-time users how to get started
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl mb-6">
          <Calendar size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          {t('welcome.title')}
        </h1>
        <p className="text-lg text-slate-600">
          {t('welcome.subtitle')}
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
              <h3 className="text-lg font-semibold text-slate-900">{t('welcome.step1Title')}</h3>
            </div>
            <p className="text-slate-600">
              {t('welcome.step1Description')}
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
              <h3 className="text-lg font-semibold text-slate-900">{t('welcome.step2Title')}</h3>
            </div>
            <p className="text-slate-600">
              {t('welcome.step2Description')}
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
              <h3 className="text-lg font-semibold text-slate-900">{t('welcome.step3Title')}</h3>
            </div>
            <p className="text-slate-600">
              {t('welcome.step3Description')}
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-indigo-900 mb-3">✓ {t('welcome.goodToKnow')}</h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>{t('welcome.feature1Title')}</strong> - {t('welcome.feature1Description')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>{t('welcome.feature2Title')}</strong> - {t('welcome.feature2Description')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>{t('welcome.feature3Title')}</strong> - {t('welcome.feature3Description')}</span>
          </li>
        </ul>
      </div>

      {/* Get Started Button */}
      <button
        onClick={onGetStarted}
        className="w-full btn-primary py-4 text-lg shadow-lg shadow-indigo-200 hover:shadow-xl"
      >
        {t('welcome.getStarted')}
      </button>
    </div>
  );
}
