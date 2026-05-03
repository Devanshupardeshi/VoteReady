/**
 * OnboardingFlow — 3-step animated question cards
 *
 * Q1: "Who are you?" — voter type selection
 * Q2: "Which state are you voting in?" — state dropdown
 * Q3: "What's your main concern today?" — primary concern
 *
 * On completion: builds VoterProfile → sets in Context → triggers navigation to Main
 */
import { useState, useCallback } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import styles from './OnboardingFlow.module.css';

/** All 28 Indian states + 8 Union Territories */
const STATES_AND_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const VOTER_TYPES = [
  { id: 'first_time', label: 'First-time Voter', desc: 'I\'m voting for the first time', icon: '🎓' },
  { id: 'returning', label: 'Returning Voter', desc: 'I\'ve voted before', icon: '🗳' },
  { id: 'nri', label: 'NRI / Overseas', desc: 'I\'m an Indian citizen abroad', icon: '✈' },
  { id: 'student', label: 'Student', desc: 'I\'m a college/university student', icon: '📚' },
];

const CONCERNS = [
  { id: 'register', label: 'Registering to vote', desc: 'How do I get on the voter roll?', icon: '📝' },
  { id: 'booth', label: 'Finding my booth', desc: 'Where do I go to vote?', icon: '📍' },
  { id: 'process', label: 'Understanding the process', desc: 'What happens step by step?', icon: '📋' },
  { id: 'candidates', label: 'Learning about candidates', desc: 'Who is running in my area?', icon: '🔍' },
];

/**
 * SVG icons to replace emojis for production UI
 * Using inline SVG for accessibility and consistency
 */
const Icons = {
  firstTime: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  returning: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6" />
      <polyline points="9 11 12 14 22 4" />
    </svg>
  ),
  nri: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  student: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  ),
  register: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  booth: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  process: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  candidates: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const iconMap = {
  first_time: Icons.firstTime,
  returning: Icons.returning,
  nri: Icons.nri,
  student: Icons.student,
  register: Icons.register,
  booth: Icons.booth,
  process: Icons.process,
  candidates: Icons.candidates,
};

export default function OnboardingFlow({ onComplete }) {
  const { setProfile } = useVoterProfile();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    voterType: '',
    state: '',
    primaryConcern: '',
  });
  const [direction, setDirection] = useState('forward');

  const handleNext = useCallback(() => {
    setDirection('forward');
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      // Complete — build profile and set
      const profile = {
        voterType: answers.voterType,
        state: answers.state,
        constituency: answers.state, // default constituency to state for now
        primaryConcern: answers.primaryConcern,
        language: 'English',
        completedSteps: [],
        checklist: [],
        isOnboarded: true,
      };
      setProfile(profile);
      if (onComplete) onComplete();
    }
  }, [step, answers, setProfile, onComplete]);

  const handleBack = useCallback(() => {
    setDirection('backward');
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const selectOption = useCallback((field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed =
    (step === 1 && answers.voterType) ||
    (step === 2 && answers.state) ||
    (step === 3 && answers.primaryConcern);

  return (
    <div className={styles.onboarding} role="main" aria-label="VoteReady onboarding">
      {/* Skip link */}
      <a href="#onboarding-content" className="skip-link">
        Skip to content
      </a>

      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="var(--accent)" />
            <path d="M20 44V20l12 18L44 20v24" stroke="var(--light-blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="18" r="4" fill="var(--green)" />
            <path d="M28 14l4-4 4 4" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.logoText}>VoteReady</span>
        </div>
        <p className={styles.tagline}>Your Personalized Election Journey</p>
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Step ${step} of 3`}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <span className={styles.progressLabel}>Step {step} of 3</span>
      </div>

      {/* Card area */}
      <div id="onboarding-content" className={styles.cardContainer}>
        <div
          className={`${styles.card} ${direction === 'forward' ? styles.slideInRight : styles.slideInLeft}`}
          key={step}
        >
          {step === 1 && (
            <>
              <h1 className={styles.cardTitle}>Who are you?</h1>
              <p className={styles.cardDescription}>This helps us personalize your election journey</p>
              <div className={styles.optionsGrid}>
                {VOTER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    className={`${styles.optionCard} ${answers.voterType === type.id ? styles.selected : ''}`}
                    onClick={() => selectOption('voterType', type.id)}
                    aria-pressed={answers.voterType === type.id}
                    aria-label={`${type.label}: ${type.desc}`}
                  >
                    <span className={styles.optionIcon} aria-hidden="true">
                      {iconMap[type.id]}
                    </span>
                    <span className={styles.optionLabel}>{type.label}</span>
                    <span className={styles.optionDesc}>{type.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className={styles.cardTitle}>Which state are you voting in?</h1>
              <p className={styles.cardDescription}>We'll show you state-specific information</p>
              <div className={styles.selectWrapper}>
                <label htmlFor="state-select" className="sr-only">Select your state or union territory</label>
                <select
                  id="state-select"
                  className={`select ${styles.stateSelect}`}
                  value={answers.state}
                  onChange={(e) => selectOption('state', e.target.value)}
                  aria-label="Select your state or union territory"
                >
                  <option value="">Choose your state / UT...</option>
                  {STATES_AND_UTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className={styles.cardTitle}>What's your main concern today?</h1>
              <p className={styles.cardDescription}>We'll take you straight to what matters most</p>
              <div className={styles.optionsGrid}>
                {CONCERNS.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.optionCard} ${answers.primaryConcern === c.id ? styles.selected : ''}`}
                    onClick={() => selectOption('primaryConcern', c.id)}
                    aria-pressed={answers.primaryConcern === c.id}
                    aria-label={`${c.label}: ${c.desc}`}
                  >
                    <span className={styles.optionIcon} aria-hidden="true">
                      {iconMap[c.id]}
                    </span>
                    <span className={styles.optionLabel}>{c.label}</span>
                    <span className={styles.optionDesc}>{c.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navButtons}>
        {step > 1 && (
          <button className="btn btn-ghost" onClick={handleBack} aria-label="Go back to previous step">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          className={`btn ${canProceed ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handleNext}
          disabled={!canProceed}
          aria-label={step === 3 ? 'Complete setup and start' : 'Continue to next step'}
        >
          {step === 3 ? 'Get Started' : 'Continue'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
