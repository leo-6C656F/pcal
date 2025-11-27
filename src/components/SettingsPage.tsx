import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Users, Database, Brain, User, Cloud } from 'lucide-react';
import { GoalManager } from './GoalManager';
import { ChildManager } from './ChildManager';
import { DataManager } from './DataManager';
import { AISettings } from './AISettings';
import { ParentNameSettings } from './ParentNameSettings';
import { CloudSyncSettings } from './CloudSyncSettings';

type SettingsTab = 'goals' | 'children' | 'data' | 'ai' | 'parent' | 'sync';

/**
 * SettingsPage Component
 * Unified settings page with tabs for Goal Management and Child Management
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('goals');

  const tabs = [
    { id: 'goals' as const, label: t('settings.goalsTab'), icon: Target },
    { id: 'children' as const, label: t('settings.childrenTab'), icon: Users },
    { id: 'parent' as const, label: 'Parent Name', icon: User },
    { id: 'sync' as const, label: 'Cloud Sync', icon: Cloud },
    { id: 'ai' as const, label: t('settings.aiTab'), icon: Brain },
    { id: 'data' as const, label: t('settings.dataTab'), icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4" aria-label="Settings tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'goals' && <GoalManager />}
        {activeTab === 'children' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('childManager.title')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{t('childManager.subtitle')}</p>
            </div>
            <ChildManager />
          </div>
        )}
        {activeTab === 'parent' && <ParentNameSettings />}
        {activeTab === 'sync' && <CloudSyncSettings />}
        {activeTab === 'ai' && <AISettings />}
        {activeTab === 'data' && <DataManager />}
      </div>
    </div>
  );
}
