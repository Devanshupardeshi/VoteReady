/**
 * ReadinessChecklist — Dynamic election readiness assessment
 *
 * Items adapt per voterType:
 * - first_time: Check voter ID, know booth, understand EVM, know docs
 * - returning: Check enrollment, know booth, check polling time
 * - nri: Check Form 6A, passport valid, know postal ballot process
 * - student: Check age eligibility, know college-address registration
 *
 * Progress persists in localStorage via VoterProfileContext
 * Score thresholds: 0-49% red, 50-79% orange, 80-100% green
 */
import { useMemo, useState } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import styles from './ReadinessChecklist.module.css';

const CHECKLISTS = {
  first_time: [
    { id: 'ft_1', label: 'I have a valid Voter ID (EPIC) card', detail: 'If not, apply for one at voters.eci.gov.in using Form 6.' },
    { id: 'ft_2', label: 'My name is on the electoral roll', detail: 'Search your name at voters.eci.gov.in → Search in Electoral Roll.' },
    { id: 'ft_3', label: 'I know my polling booth location', detail: 'Use the Booth Finder tab to locate your station.' },
    { id: 'ft_4', label: 'I understand how to use an EVM', detail: 'Watch the video guide in the Timeline tab for a step-by-step demo.' },
    { id: 'ft_5', label: 'I know which documents to carry on polling day', detail: 'Any one of the 12 approved photo IDs: Voter ID, Aadhaar, Passport, DL, etc.' },
    { id: 'ft_6', label: 'I know the election date for my constituency', detail: 'Check the Timeline tab or visit eci.gov.in for polling schedule.' },
  ],
  returning: [
    { id: 're_1', label: 'My enrollment is up to date at my current address', detail: 'If you moved, file Form 8 for address change at voters.eci.gov.in.' },
    { id: 're_2', label: 'I know my assigned polling booth', detail: 'Booth assignments can change. Verify before election day.' },
    { id: 're_3', label: 'I have checked the polling time', detail: 'Typically 7 AM to 6 PM, but varies by state.' },
    { id: 're_4', label: 'I have a valid photo ID ready', detail: 'Any one of the 12 approved documents.' },
    { id: 're_5', label: 'I know the 48-hour silence rule', detail: 'No campaigning allowed 48 hours before polling.' },
  ],
  nri: [
    { id: 'nri_1', label: 'I have submitted Form 6A to my constituency', detail: 'NRI-specific registration at voters.eci.gov.in.' },
    { id: 'nri_2', label: 'My Indian passport is valid', detail: 'Required as primary ID for overseas voter registration.' },
    { id: 'nri_3', label: 'I understand the ETPBS (postal ballot) process', detail: 'Electronic Transmitted Postal Ballot System — check eci.gov.in for latest updates.' },
    { id: 'nri_4', label: 'I have registered at the Indian embassy/consulate', detail: 'Contact your nearest mission for election-related guidance.' },
    { id: 'nri_5', label: 'I know the deadline to return my postal ballot', detail: 'Must reach the Returning Officer before counting day.' },
  ],
  student: [
    { id: 'st_1', label: 'I am 18+ years old on the qualifying date', detail: 'You must be 18 on or before January 1st of the revision year.' },
    { id: 'st_2', label: 'I know whether to register at home or college address', detail: 'You can register at either, but vote only at the registered address.' },
    { id: 'st_3', label: 'I have submitted my voter registration (Form 6)', detail: 'Apply online at voters.eci.gov.in or at the ERO office.' },
    { id: 'st_4', label: 'I have proof of age and address', detail: 'Class 10 mark sheet, birth certificate, Aadhaar, or college ID with address.' },
    { id: 'st_5', label: 'I know my polling booth for the registered address', detail: 'Use the Booth Finder tab after your registration is confirmed.' },
  ],
};

export default function ReadinessChecklist() {
  const { profile, toggleChecklistItem } = useVoterProfile();
  const [expandedItem, setExpandedItem] = useState(null);

  const checklistItems = CHECKLISTS[profile.voterType] || CHECKLISTS.first_time;

  // Calculate score
  const score = useMemo(() => {
    const total = checklistItems.length;
    const completed = checklistItems.filter((item) =>
      profile.checklist.includes(item.id)
    ).length;
    return {
      completed,
      total,
      /* v8 ignore next */
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [checklistItems, profile.checklist]);

  // Score color
  const getScoreColor = () => {
    if (score.percentage >= 80) return 'var(--green)';
    if (score.percentage >= 50) return 'var(--orange)';
    return '#dc2626';
  };

  const getScoreLabel = () => {
    if (score.percentage >= 80) return 'Ready to Vote!';
    if (score.percentage >= 50) return 'Almost there!';
    return 'Getting started';
  };

  return (
    <section className={styles.checklist} aria-label="Election Readiness Checklist">
      {/* Score card */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreRing}>
          <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--border-light)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={getScoreColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score.percentage / 100) * 264} 264`}
              transform="rotate(-90 50 50)"
              className={styles.scoreProgress}
            />
          </svg>
          <div className={styles.scoreText}>
            <span className={styles.scoreNumber} style={{ color: getScoreColor() }}>{score.percentage}%</span>
          </div>
        </div>
        <div className={styles.scoreInfo}>
          <h2 className={styles.scoreLabel} style={{ color: getScoreColor() }}>{getScoreLabel()}</h2>
          <p className={styles.scoreSubtext}>{score.completed} of {score.total} items completed</p>
        </div>
      </div>

      {/* Checklist items */}
      <div className={styles.items} role="list">
        {checklistItems.map((item) => {
          const isChecked = profile.checklist.includes(item.id);
          const isExpanded = expandedItem === item.id;

          return (
            <div
              key={item.id}
              className={`${styles.item} ${isChecked ? styles.checked : ''}`}
              role="listitem"
            >
              <label className={styles.itemLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isChecked}
                  onChange={() => toggleChecklistItem(item.id)}
                  aria-label={item.label}
                />
                <span className={styles.customCheck}>
                  {isChecked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={styles.labelText}>{item.label}</span>
              </label>

              <button
                className={styles.infoBtn}
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                aria-expanded={isExpanded}
                aria-label={`More info about: ${item.label}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>

              {isExpanded && (
                <div className={styles.detail}>
                  <p>{item.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
