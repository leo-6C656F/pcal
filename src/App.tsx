import { useEffect, useState } from 'react';
import { useStore } from './store';
import { initializeDatabase } from './services/journalReplay';
import { Dashboard } from './components/Dashboard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { GoalManager } from './components/GoalManager';
import { ArrowLeft, Settings } from 'lucide-react';

type View = 'dashboard' | 'entry' | 'settings';

/**
 * PCAL - Parent-Child Activity Log
 * Main Application Component
 */
function App() {
  const { currentEntry, setCurrentEntry, loadChildren, loadEntries, loadGoals } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[APP] Initializing PCAL...');

        // Initialize database and run recovery if needed
        await initializeDatabase();

        // Load data
        await loadChildren();
        await loadEntries();
        await loadGoals();

        setIsInitialized(true);
        console.log('[APP] PCAL initialized successfully');
      } catch (error) {
        console.error('[APP] Initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    init();
  }, [loadChildren, loadEntries, loadGoals]);

  // Update view when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setCurrentView('entry');
    } else if (currentView === 'entry') {
      setCurrentView('dashboard');
    }
  }, [currentEntry]);

  if (initError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg">
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Initialization Error
          </h1>
          <p className="text-red-700 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Initializing PCAL...</p>
        </div>
      </div>
    );
  }

  const handleBackToDashboard = () => {
    setCurrentEntry(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            {currentView !== 'dashboard' && (
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            )}
            {currentView === 'dashboard' && (
              <div className="flex-1" />
            )}
            {currentView === 'dashboard' && (
              <button
                onClick={() => setCurrentView('settings')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <Settings size={16} />
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-6">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'entry' && <DailyEntryForm />}
          {currentView === 'settings' && <GoalManager />}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          PCAL v1.0 | 100% Offline | Event Sourced | Built for Head Start Programs
        </div>
      </footer>
    </div>
  );
}

export default App;
