/**
 * App.jsx — Root Application Component
 *
 * Flow: Splash (1.5s) → Onboarding (3 steps) → Main App (4 tabs)
 *
 * Tabs:
 * 1. Timeline — ElectionTimeline + VideoCard (on "Watch Guide")
 * 2. Ask AI — ChatAssistant (Gemini)
 * 3. Candidates — CandidateSearch + BoothLocator
 * 4. Checklist — ReadinessChecklist
 */
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { VoterProfileProvider, useVoterProfile } from './context/VoterProfileContext.jsx';

// Eagerly loaded (critical path)
import OnboardingFlow from './components/Onboarding/OnboardingFlow.jsx';
import AppHeader from './components/Layout/AppHeader.jsx';

// Lazy loaded (non-critical)
const ElectionTimeline = lazy(() => import('./components/Timeline/ElectionTimeline.jsx'));
const ChatAssistant = lazy(() => import('./components/Chat/ChatAssistant.jsx'));
const CandidateSearch = lazy(() => import('./components/Search/CandidateSearch.jsx'));
const BoothLocator = lazy(() => import('./components/Maps/BoothLocator.jsx'));
const ReadinessChecklist = lazy(() => import('./components/Checklist/ReadinessChecklist.jsx'));
const VideoCard = lazy(() => import('./components/YouTube/VideoCard.jsx'));
const AddToCalendar = lazy(() => import('./components/Calendar/AddToCalendar.jsx'));

/** Splash screen component */
function SplashScreen() {
  return (
    <div className="splash-screen" role="presentation" aria-label="Loading VoteReady">
      <div className="splash-content">
        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#0F3460" />
          <path d="M20 44V20l12 18L44 20v24" stroke="#E8F0FE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="18" r="4" fill="#22C55E" />
          <path d="M28 14l4-4 4 4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="splash-title">VoteReady</h1>
        <p className="splash-subtitle">Your Election Journey Starts Here</p>
        <div className="splash-loader">
          <div className="splash-loader-fill" />
        </div>
      </div>
    </div>
  );
}

/** Loading fallback for lazy components */
function TabLoader() {
  return (
    <div className="tab-loader" role="status" aria-label="Loading content">
      <div className="tab-loader-spinner" />
      <p className="tab-loader-text">Loading...</p>
    </div>
  );
}

/** Tab icon SVGs */
const TAB_ICONS = {
  timeline: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  candidates: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  checklist: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: TAB_ICONS.timeline },
  { id: 'chat', label: 'Ask AI', icon: TAB_ICONS.chat },
  { id: 'candidates', label: 'Candidates', icon: TAB_ICONS.candidates },
  { id: 'checklist', label: 'Checklist', icon: TAB_ICONS.checklist },
];

/** Main App Content — inner component that uses VoterProfile context */
function AppContent() {
  const { profile, resetProfile } = useVoterProfile();
  const [appState, setAppState] = useState('splash'); // splash | onboarding | main
  const [activeTab, setActiveTab] = useState('timeline');

  // Video/Calendar modals
  const [videoQuery, setVideoQuery] = useState(null);
  const [videoStep, setVideoStep] = useState(null);
  const [calendarEvent, setCalendarEvent] = useState(null);

  // Chat initial prompt (from candidates concern)
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');

  // Splash → check profile → onboarding or main
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile.isOnboarded) {
        setAppState('main');
      } else {
        setAppState('onboarding');
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setAppState('main');
  }, []);

  const handleReset = useCallback(() => {
    resetProfile();
    setAppState('onboarding');
    setActiveTab('timeline');
  }, [resetProfile]);

  // Timeline "Watch Guide" handler
  const handleWatchGuide = useCallback((stepNumber) => {
    const STEPS_DATA = {
      1: 'India election announcement ECI official',
      2: 'voter registration ECI official',
      3: 'India election nomination process ECI',
      4: 'India election campaign rules ECI',
      5: 'how to vote EVM VVPAT ECI',
      6: 'India election vote counting process ECI',
      7: 'India government formation after election',
    };
    const query = STEPS_DATA[stepNumber] || 'Indian elections ECI';
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }, []);

  // Timeline "Add to Calendar" handler
  const handleAddToCalendar = useCallback((step) => {
    setCalendarEvent({
      title: step.calendarEvent || step.title,
      description: step.detail || step.subtitle,
      location: '',
    });
  }, []);

  // ─── RENDER ─── //
  if (appState === 'splash') return <SplashScreen />;

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-layout">
      <AppHeader onLanguageChange={() => {}} onReset={handleReset} />

      {/* Main content */}
      <main className="app-main">
        <div className="app-container">
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'timeline' && (
              <ElectionTimeline
                onWatchGuide={handleWatchGuide}
                onAddToCalendar={handleAddToCalendar}
              />
            )}
            {activeTab === 'chat' && (
              <ChatAssistant initialPrompt={chatInitialPrompt} />
            )}
            {activeTab === 'candidates' && (
              <div className="candidates-page">
                <CandidateSearch />
                <div className="candidates-divider" />
                <BoothLocator />
              </div>
            )}
            {activeTab === 'checklist' && <ReadinessChecklist />}
          </Suspense>
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="tab-bar" role="tablist" aria-label="Main navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Video modal */}
      {videoQuery && (
        <Suspense fallback={null}>
          <div className="video-modal-overlay" onClick={() => { setVideoQuery(null); setVideoStep(null); }}>
            <div className="video-modal" onClick={(e) => e.stopPropagation()}>
              <div className="video-modal-header">
                <h3>Step {videoStep} — Video Guides</h3>
                <button className="video-modal-close" onClick={() => { setVideoQuery(null); setVideoStep(null); }} aria-label="Close video panel">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <VideoCard searchQuery={videoQuery} stepNumber={videoStep} />
            </div>
          </div>
        </Suspense>
      )}

      {/* Calendar modal */}
      {calendarEvent && (
        <Suspense fallback={null}>
          <AddToCalendar event={calendarEvent} onClose={() => setCalendarEvent(null)} />
        </Suspense>
      )}
    </div>
  );
}

/** Root App with Provider */
export default function App() {
  return (
    <VoterProfileProvider>
      <AppContent />
    </VoterProfileProvider>
  );
}
