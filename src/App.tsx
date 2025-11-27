import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { format } from 'date-fns';
import { useStore } from './store';
import { initializeDatabase } from './services/journalReplay';
import { Dashboard } from './components/Dashboard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { SettingsPage } from './components/SettingsPage';
import { PDFExportPage } from './components/PDFExportPage';
import { ToastContainer } from './components/ToastContainer';
import { LanguageSelector } from './components/LanguageSelector';
import { ThemeToggle } from './components/ThemeToggle';
import { useToast } from './hooks/useToast';
import { preWarmModel, isModelReady, getProviderMode } from './services/aiService';
import type { ModelLoadingState } from './types';
import { ArrowLeft, Settings, BookOpenCheck, RefreshCw, Brain, X } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';

type View = 'dashboard' | 'entry' | 'settings';

// Navigation state for browser history
interface NavState {
  view: View;
  subView?: 'list' | 'form' | 'finalize';
}

// Create a toast context to share across the app
export let showToast: ReturnType<typeof useToast>;

/**
 * PCAL - Parent-Child Activity Log
 * Main Application Component
 */
function App() {
  const { t } = useTranslation();
  const { currentEntry, setCurrentEntry, loadChildren, loadEntries, loadGoals, autoSyncOnLoad } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [entrySubView, setEntrySubView] = useState<'list' | 'form' | 'finalize'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modelLoadingState, setModelLoadingState] = useState<ModelLoadingState | null>(null);
  const [showModelBanner, setShowModelBanner] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Track if we're handling a popstate event to avoid pushing duplicate states
  const isPopstateHandlingRef = useRef(false);

  // Detect if running as PWA (standalone mode)
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );

  // Make toast globally available
  showToast = toast;

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

        // Auto-sync from cloud if enabled (runs in background)
        autoSyncOnLoad().catch(error => {
          console.error('[APP] Auto-sync on load failed:', error);
        });
      } catch (error) {
        console.error('[APP] Initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    init();
    // Store functions are stable (from Zustand), so we don't need them as dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update view when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setCurrentView('entry');
    } else {
      // Only change to dashboard if we were on entry view
      setCurrentView(prev => (prev === 'entry') ? 'dashboard' : prev);
    }
  }, [currentEntry]);

  // Initialize browser history state on first load
  useEffect(() => {
    // Set initial state if there's no state yet
    if (!window.history.state?.view) {
      window.history.replaceState({ view: 'dashboard' } as NavState, '');
    }
  }, []);

  // Push history state when view changes (but not when handling popstate)
  useEffect(() => {
    if (isPopstateHandlingRef.current) return;

    const currentState = window.history.state as NavState | null;
    const newState: NavState = {
      view: currentView,
      subView: currentView === 'entry' ? entrySubView : undefined
    };

    // Only push if the state actually changed
    if (currentState?.view !== newState.view ||
        (currentView === 'entry' && currentState?.subView !== newState.subView)) {
      window.history.pushState(newState, '');
    }
  }, [currentView, entrySubView]);

  // Handle browser back button
  const handlePopState = useCallback((event: PopStateEvent) => {
    isPopstateHandlingRef.current = true;
    const state = event.state as NavState | null;

    if (!state) {
      // No state means we're at the initial page, go to dashboard
      setCurrentEntry(null);
      setCurrentView('dashboard');
      setEntrySubView('list');
    } else {
      // Navigate to the state's view
      if (state.view === 'dashboard') {
        setCurrentEntry(null);
        setCurrentView('dashboard');
        setEntrySubView('list');
      } else if (state.view === 'entry') {
        setCurrentView('entry');
        setEntrySubView(state.subView || 'list');
      } else if (state.view === 'settings') {
        setCurrentView('settings');
      }
    }

    // Reset the flag synchronously after React processes the state updates
    // Using requestAnimationFrame to ensure this happens after the render cycle
    requestAnimationFrame(() => {
      isPopstateHandlingRef.current = false;
    });
  }, [setCurrentEntry]);

  // Listen for browser back/forward button
  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  // Callback for DailyEntryForm to update sub-view state
  const handleEntrySubViewChange = useCallback((subView: 'list' | 'form' | 'finalize') => {
    setEntrySubView(subView);
  }, []);

  // Pre-warm AI model after app initializes (only if local mode is selected)
  useEffect(() => {
    if (!isInitialized) return;
    if (isModelReady()) return; // Already loaded

    // Only pre-warm if user has explicitly selected local mode
    if (getProviderMode() !== 'local') return;

    // Small delay to let the UI settle first
    const timer = setTimeout(() => {
      console.log('[AI] Starting model pre-warm...');
      setModelLoadingState({ isLoading: true, progress: 0, status: 'Loading AI model...' });
      setShowModelBanner(true);
      preWarmModel((state) => {
        console.log('[AI] Model progress:', state);
        setModelLoadingState(state);
        if (!state.isLoading && state.progress === 100) {
          // Model loaded, hide banner after a short delay
          setTimeout(() => setShowModelBanner(false), 1500);
        }
        if (state.error) {
          // Hide banner on error after showing briefly
          setTimeout(() => setShowModelBanner(false), 3000);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  if (initError) {
    return (
      <main className="min-h-screen bg-rose-50 dark:bg-rose-950 flex items-center justify-center p-6 transition-colors">
        <div className="card p-8 max-w-lg w-full border-rose-100 dark:border-rose-900 bg-white dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl" role="img" aria-label="Warning">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t('app.initializationError')}
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
            >
              {t('app.reloadApp')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="text-center" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-primary border-t-transparent" aria-hidden="true"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300 font-medium">{t('app.initializingPcal')}</p>
        </div>
      </main>
    );
  }

  const handleBackToDashboard = () => {
    setCurrentEntry(null);
    setCurrentView('dashboard');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Check for service worker updates (new app version)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Check for updates
        await registration.update();

        // If there's a waiting worker, activate it
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }

    // Reload to apply updates (data in IndexedDB will persist)
    window.location.reload();
  };

  const navigateToExport = () => {
    navigate('/export-pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 font-sans transition-colors">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* AI Model Loading Indicator - Small floating circle */}
      {showModelBanner && modelLoadingState && modelLoadingState.isLoading && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="group relative">
            {/* Small circular indicator */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-ochs-blue rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              {/* Progress ring */}
              <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${modelLoadingState.progress} 100`}
                  className="transition-all duration-300"
                />
              </svg>
              {/* Center icon */}
              <Brain size={16} className="text-white relative z-10" />
              {/* Close button on hover */}
              <button
                onClick={() => setShowModelBanner(false)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label={t('common.close')}
              >
                <X size={10} className="text-white" />
              </button>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                <p className="font-medium">{modelLoadingState.status || t('app.loadingAI')}</p>
                <p className="text-slate-300 mt-0.5">{modelLoadingState.progress}% {t('app.complete')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-soft transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'dashboard' && (
              <button
                onClick={handleBackToDashboard}
                className="p-2 -ml-2 text-slate-500 hover:text-primary hover:bg-blue-50 dark:text-slate-400 dark:hover:text-primary dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label={t('app.back')}
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="bg-primary dark:bg-primary/90 p-1.5 rounded-lg">
                <BookOpenCheck size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
                {t('app.name')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPWA && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-slate-500 hover:text-primary hover:bg-blue-50 dark:text-slate-400 dark:hover:text-primary dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                aria-label={t('app.refresh')}
                title={t('app.refresh')}
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <ThemeToggle />
            <LanguageSelector />
            <button
              onClick={() => setCurrentView('settings')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all text-slate-600 hover:text-primary hover:bg-slate-100 dark:text-slate-400 dark:hover:text-primary dark:hover:bg-slate-800"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">{t('app.goalsAndSetup')}</span>
            </button>

            {/* Clerk Authentication */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-primary hover:bg-primary/90 text-white shadow-sm">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedOut>
          {/* Show sign-in prompt for unauthenticated users */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card p-8 max-w-lg w-full text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
                  <BookOpenCheck size={48} className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Welcome to PCAL
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Please sign in to access your Parent-Child Activity Log, create entries, and track your child's development.
              </p>
              <SignInButton mode="modal">
                <button className="btn-primary w-full">
                  Sign In to Continue
                </button>
              </SignInButton>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  ✓ Secure authentication • ✓ Your data stays private • ✓ Works offline
                </p>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="animate-fade-in">
            <Routes>
              <Route path="/export-pdf" element={<PDFExportPage />} />
              <Route path="/" element={
                <>
                  {currentView === 'dashboard' && <Dashboard onNavigateToExport={navigateToExport} />}
                  {currentView === 'entry' && (
                    <DailyEntryForm
                      subView={entrySubView}
                      onSubViewChange={handleEntrySubViewChange}
                    />
                  )}
                  {currentView === 'settings' && <SettingsPage />}
                </>
              } />
            </Routes>
          </div>
        </SignedIn>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-auto bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {t('app.version')} • {format(new Date(__BUILD_TIMESTAMP__), 'MMM d, yyyy h:mm a')}
              </p>
              <p>{t('app.tagline')}</p>
            </div>
            <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span>✓ {t('app.worksOffline')}</span>
              <span>•</span>
              <span>✓ {t('app.dataPrivacy')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
