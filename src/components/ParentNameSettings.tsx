import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Check } from 'lucide-react';

/**
 * Parent Name Settings Component
 * Allows users to configure the parent name that appears on PDF exports
 * Can use Clerk default name or custom name
 */

interface ParentNameConfig {
  useClerkName: boolean;
  customName: string;
}

const STORAGE_KEY = 'parentNameConfig';

export function ParentNameSettings() {
  const { user } = useUser();
  const [config, setConfig] = useState<ParentNameConfig>({
    useClerkName: true,
    customName: ''
  });
  const [saved, setSaved] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ParentNameConfig;
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to parse parent name config:', error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUseClerkNameChange = (useClerk: boolean) => {
    setConfig({ ...config, useClerkName: useClerk });
  };

  const handleCustomNameChange = (name: string) => {
    setConfig({ ...config, customName: name });
  };

  // Get the name from Clerk (fullName, or fallback to firstName + lastName, or email)
  const clerkName = user?.fullName ||
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` :
    user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Not available');

  // Get the effective name that will be used
  const effectiveName = config.useClerkName ? clerkName : config.customName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Parent Name Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure the parent name that appears on PDF exports
        </p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Current Name Preview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Current parent name on PDFs
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {effectiveName || '(No name set)'}
              </p>
            </div>
          </div>
        </div>

        {/* Name Source Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Name Source
          </h3>

          {/* Use Clerk Name Option */}
          <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            config.useClerkName
              ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}>
            <input
              type="radio"
              name="nameSource"
              checked={config.useClerkName}
              onChange={() => handleUseClerkNameChange(true)}
              className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                Use name from account
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Automatically use the name from your Clerk account
              </p>
              {user && (
                <div className="mt-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account name: <span className="text-slate-900 dark:text-white font-bold">{clerkName}</span>
                  </p>
                </div>
              )}
            </div>
          </label>

          {/* Use Custom Name Option */}
          <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            !config.useClerkName
              ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}>
            <input
              type="radio"
              name="nameSource"
              checked={!config.useClerkName}
              onChange={() => handleUseClerkNameChange(false)}
              className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                Use custom name
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Enter a custom name to appear on PDF exports
              </p>
              {!config.useClerkName && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={config.customName}
                    onChange={(e) => handleCustomNameChange(e.target.value)}
                    placeholder="Enter parent name..."
                    className="input-field w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            disabled={!config.useClerkName && !config.customName.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
          About Parent Name
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The parent name is displayed on the PCAL In-Kind Form PDF exports in the "PARENT NAME (Print)" field.
          You can choose to automatically use the name from your account or enter a custom name.
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to get the parent name from config
 * Can be used by other components to retrieve the configured parent name
 */
export function getParentName(user: any): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  let config: ParentNameConfig = {
    useClerkName: true,
    customName: ''
  };

  if (stored) {
    try {
      config = JSON.parse(stored) as ParentNameConfig;
    } catch (error) {
      console.error('Failed to parse parent name config:', error);
    }
  }

  if (config.useClerkName && user) {
    return user.fullName ||
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` :
      user.firstName || user.primaryEmailAddress?.emailAddress || '');
  }

  return config.customName || '';
}
