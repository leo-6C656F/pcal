import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

/**
 * Cloud Sync Settings Component
 * Allows users to configure cloud synchronization with Vercel Postgres
 * Users can enable/disable sync and manually trigger sync operations
 */
export function CloudSyncSettings() {
  const { user, isSignedIn } = useUser();
  const {
    syncStatus,
    toggleCloudSync,
    syncToCloud,
    syncFromCloud,
    checkCloudSyncAvailability,
  } = useStore();

  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check cloud sync availability on mount
  useEffect(() => {
    checkCloudSyncAvailability();
  }, [checkCloudSyncAvailability, isSignedIn]);

  const handleToggleSync = (enabled: boolean) => {
    if (enabled && !isSignedIn) {
      setStatusMessage({
        type: 'error',
        message: 'You must be signed in to enable cloud sync',
      });
      return;
    }

    toggleCloudSync(enabled);
    setStatusMessage({
      type: 'success',
      message: enabled ? 'Cloud sync enabled' : 'Cloud sync disabled',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSyncUp = async () => {
    setIsSyncingUp(true);
    setStatusMessage(null);

    const success = await syncToCloud();

    setIsSyncingUp(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        message: 'Successfully synced to cloud',
      });
    } else {
      setStatusMessage({
        type: 'error',
        message: syncStatus.lastSyncError || 'Failed to sync to cloud',
      });
    }

    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSyncDown = async () => {
    setIsSyncingDown(true);
    setStatusMessage(null);

    const success = await syncFromCloud();

    setIsSyncingDown(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        message: 'Successfully synced from cloud',
      });
    } else {
      setStatusMessage({
        type: 'error',
        message: syncStatus.lastSyncError || 'Failed to sync from cloud',
      });
    }

    setTimeout(() => setStatusMessage(null), 5000);
  };

  const formatLastSync = (lastSyncAt: string | null): string => {
    if (!lastSyncAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Cloud Sync Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Sync your data across devices with cloud storage
        </p>
      </div>

      {/* Authentication Warning */}
      {!isSignedIn && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Sign in required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You must be signed in to use cloud sync. Please sign in to enable this feature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`rounded-lg p-4 ${
          statusMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {statusMessage.type === 'success' ? (
              <Check size={20} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              statusMessage.type === 'success'
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {statusMessage.message}
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-6">
        {/* Sync Status */}
        <div className={`rounded-lg p-4 ${
          syncStatus.syncEnabled
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              syncStatus.syncEnabled
                ? 'bg-blue-500'
                : 'bg-slate-400'
            }`}>
              {syncStatus.syncEnabled ? (
                <Cloud size={20} className="text-white" />
              ) : (
                <CloudOff size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                syncStatus.syncEnabled
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                Cloud sync is {syncStatus.syncEnabled ? 'enabled' : 'disabled'}
              </p>
              <p className={`text-xs ${
                syncStatus.syncEnabled
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                Last synced: {formatLastSync(syncStatus.lastSyncAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Sync Configuration
          </h3>

          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all">
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                Enable Cloud Sync
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Automatically sync your data to the cloud for backup and multi-device access
              </p>
            </div>
            <div className="ml-4">
              <button
                type="button"
                role="switch"
                aria-checked={syncStatus.syncEnabled}
                disabled={!isSignedIn}
                onClick={() => handleToggleSync(!syncStatus.syncEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  syncStatus.syncEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    syncStatus.syncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </label>
        </div>

        {/* Manual Sync Buttons */}
        {syncStatus.syncEnabled && isSignedIn && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Manual Sync
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sync Up */}
              <button
                onClick={handleSyncUp}
                disabled={isSyncingUp || syncStatus.isSyncing}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={isSyncingUp ? 'animate-spin' : ''} />
                {isSyncingUp ? 'Syncing...' : 'Push to Cloud'}
              </button>

              {/* Sync Down */}
              <button
                onClick={handleSyncDown}
                disabled={isSyncingDown || syncStatus.isSyncing}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={isSyncingDown ? 'animate-spin' : ''} />
                {isSyncingDown ? 'Syncing...' : 'Pull from Cloud'}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Push to Cloud saves your local data to the cloud. Pull from Cloud downloads cloud data to this device.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              About Cloud Sync
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Cloud sync is <strong>completely optional</strong> - you can continue using PCAL entirely offline</li>
              <li>Your data is stored securely in Vercel Postgres with your user account</li>
              <li>Use cloud sync to access your data from multiple devices</li>
              <li>All data remains in your local browser even with sync enabled</li>
              <li>Push to Cloud sends your local data to the cloud (backup)</li>
              <li>Pull from Cloud downloads cloud data to this device (restore)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
