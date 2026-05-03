/**
 * AppHeader — Top navigation bar
 *
 * Contains: Logo + app name, language selector dropdown, profile badge
 */
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import styles from './AppHeader.module.css';

const LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu',
  'Bengali', 'Kannada', 'Gujarati', 'Punjabi', 'Malayalam',
];

const VOTER_TYPE_LABELS = {
  first_time: 'First-time Voter',
  returning: 'Returning Voter',
  nri: 'NRI / Overseas',
  student: 'Student',
};

export default function AppHeader({ onLanguageChange, onReset }) {
  const { profile, updateLanguage } = useVoterProfile();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    updateLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logoGroup}>
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true" className={styles.logoSvg}>
            <rect width="64" height="64" rx="14" fill="var(--accent)" />
            <path d="M20 44V20l12 18L44 20v24" stroke="var(--light-blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="18" r="4" fill="var(--green)" />
            <path d="M28 14l4-4 4 4" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className={styles.logoName}>VoteReady</h1>
        </div>

        {/* Right controls */}
        <div className={styles.controls}>
          {/* Language selector */}
          <div className={styles.langWrapper}>
            <label htmlFor="lang-select" className="sr-only">Select language</label>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.langIcon}>
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <select
              id="lang-select"
              className={styles.langSelect}
              value={profile.language}
              onChange={handleLanguageChange}
              aria-label="Select display language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Profile badge */}
          <div className={styles.profileBadge} aria-label={`Profile: ${VOTER_TYPE_LABELS[profile.voterType] || 'Unknown'}, ${profile.state}`}>
            <div className={styles.profileAvatar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileType}>{VOTER_TYPE_LABELS[profile.voterType]}</span>
              <span className={styles.profileState}>{profile.state}</span>
            </div>
          </div>

          {/* Reset button */}
          <button
            className={styles.resetBtn}
            onClick={onReset}
            aria-label="Reset profile and return to onboarding"
            title="Reset profile"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
