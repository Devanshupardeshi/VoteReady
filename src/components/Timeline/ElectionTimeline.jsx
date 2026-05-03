/**
 * ElectionTimeline — 7-step visual timeline of Indian election process
 *
 * Personalization rules:
 * - first_time → Steps 1–2 highlighted with "Action Required" badge
 * - returning  → Step 4 foregrounded (booth finding)
 * - nri        → Show only overseas-relevant steps, add postal ballot note
 * - student    → Simplified language, Step 2 highlighted
 */
import { useMemo, useState } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import StepCard from './StepCard.jsx';
import styles from './ElectionTimeline.module.css';

/** The 7 election steps — full data */
const STEPS = [
  {
    number: 1,
    title: 'Election Announcement',
    subtitle: 'Model Code of Conduct kicks in',
    detail: 'The Election Commission of India (ECI) announces the election schedule. From this moment, the Model Code of Conduct (MCC) comes into effect. Political parties and candidates must follow strict guidelines — no new government schemes can be announced, and ministers cannot use official machinery for campaigning. This ensures a level playing field for all candidates.',
    youtubeQuery: 'India election announcement ECI official',
    calendarEvent: 'Election Announced — Model Code of Conduct begins',
    nriRelevant: true,
  },
  {
    number: 2,
    title: 'Voter Roll Verification',
    subtitle: 'Check or add your name at voters.eci.gov.in',
    detail: 'Before you can vote, your name must be on the electoral roll. Visit voters.eci.gov.in to check if you\'re registered. If not, fill Form 6 to register as a new voter, or Form 8 if you\'ve moved to a new constituency. You\'ll need proof of age (birth certificate, Class 10 mark sheet) and proof of address. Registration typically takes 2-4 weeks to process.',
    youtubeQuery: 'voter registration ECI official',
    calendarEvent: 'Registration Deadline — Verify your name on voter roll',
    nriRelevant: true,
    nriNote: 'NRI voters can register using Form 6A specifically designed for overseas electors. You\'ll need a valid Indian passport as proof of identity.',
  },
  {
    number: 3,
    title: 'Nomination & Scrutiny',
    subtitle: 'Candidate filing and deadline',
    detail: 'Candidates file their nomination papers with the Returning Officer. They must submit an affidavit declaring their criminal record, assets, liabilities, and educational qualifications. The Returning Officer scrutinizes all nominations and rejects any that don\'t meet legal requirements. Candidates can withdraw their nominations before the last date of withdrawal.',
    youtubeQuery: 'India election nomination process ECI',
    calendarEvent: 'Nomination Filing Deadline',
    nriRelevant: false,
  },
  {
    number: 4,
    title: 'Campaigning Period',
    subtitle: 'Rules, schedule, and the 48-hour silence rule',
    detail: 'Political parties and candidates campaign to win votes. All campaigning must follow ECI guidelines — no hate speech, no bribing voters, no use of religious or caste-based appeals. Campaigning stops 48 hours before polling begins (the "silence period"). This cooling-off period lets voters make their final decisions without undue influence.',
    youtubeQuery: 'India election campaign rules ECI',
    calendarEvent: 'Campaign Period — 48-hour silence before polling',
    nriRelevant: false,
  },
  {
    number: 5,
    title: 'Polling Day',
    subtitle: 'EVM usage, VVPAT, documents needed, booth etiquette',
    detail: 'On polling day, carry a valid photo ID (Voter ID card, Aadhaar, passport, driving license, or any government-issued photo ID from the list of 12 accepted documents). At the polling booth: (1) Your name is verified and finger is inked. (2) You receive a ballot slip. (3) You enter the polling booth and press the button next to your chosen candidate on the EVM (Electronic Voting Machine). (4) Check the VVPAT slip to verify your vote was recorded correctly. The entire process takes 2-5 minutes.',
    youtubeQuery: 'how to vote EVM VVPAT ECI',
    calendarEvent: 'Polling Day — Cast your vote!',
    nriRelevant: true,
    nriNote: 'NRI voters who have registered under Form 6A can vote in person at their designated polling booth in India. Postal ballot facility for overseas voters is being expanded — check eci.gov.in for the latest updates on e-Postal Ballot (ETPBS).',
  },
  {
    number: 6,
    title: 'Vote Counting',
    subtitle: 'Process, postal ballots, and result timeline',
    detail: 'Votes are counted at designated counting centers under tight security and CCTV surveillance. The process: (1) Postal ballots are counted first. (2) EVM counts begin — each machine is opened, and votes are tallied electronically. (3) VVPAT slips from randomly selected booths are matched against EVM counts for verification. (4) Results are declared constituency by constituency. Counting typically starts at 8 AM and most results are known by evening.',
    youtubeQuery: 'India election vote counting process ECI',
    calendarEvent: 'Vote Counting Day — Results announced',
    nriRelevant: true,
  },
  {
    number: 7,
    title: 'Government Formation',
    subtitle: 'Majority threshold, oath, and cabinet formation',
    detail: 'The party (or coalition) that wins a majority of seats — at least 272 out of 543 in the Lok Sabha — is invited by the President to form the government. The leader of the majority party takes oath as Prime Minister at Rashtrapati Bhavan. The PM then selects cabinet ministers, who also take their oaths. The newly formed government presents its policy agenda to Parliament.',
    youtubeQuery: 'India government formation after election',
    calendarEvent: 'Government Formation — New PM takes oath',
    nriRelevant: true,
  },
];

export default function ElectionTimeline({ onWatchGuide, onAddToCalendar }) {
  const { profile, toggleStep } = useVoterProfile();
  const [activeStep, setActiveStep] = useState(null);

  /** Compute which steps to show and how to highlight them */
  const timelineData = useMemo(() => {
    const { voterType, completedSteps } = profile;

    return STEPS.map((step) => {
      let isHighlighted = false;
      let badge = null;
      let showStep = true;
      let nriNote = null;

      switch (voterType) {
        case 'first_time':
          if (step.number <= 2) {
            isHighlighted = true;
            badge = 'Action Required';
          }
          break;
        case 'returning':
          if (step.number === 4 || step.number === 5) {
            isHighlighted = true;
            badge = step.number === 5 ? 'Action Required' : 'Important';
          }
          break;
        case 'nri':
          showStep = step.nriRelevant;
          if (step.nriNote) nriNote = step.nriNote;
          if (step.number === 2 || step.number === 5) {
            isHighlighted = true;
            badge = 'Action Required';
          }
          break;
        case 'student':
          if (step.number === 2) {
            isHighlighted = true;
            badge = 'Action Required';
          }
          break;
        default:
          break;
      }

      return {
        ...step,
        isHighlighted,
        badge,
        showStep,
        nriNote,
        isCompleted: completedSteps.includes(step.number),
      };
    }).filter((s) => s.showStep);
  }, [profile]);

  return (
    <section className={styles.timeline} aria-label="Election Process Timeline">
      <div className={styles.header}>
        <h2 className={styles.title}>Your Election Journey</h2>
        <p className={styles.subtitle}>
          {profile.completedSteps.length} of {timelineData.length} steps completed
        </p>
        <div className={styles.miniProgress}>
          <div
            className={styles.miniProgressFill}
            style={{ width: `${(profile.completedSteps.length / timelineData.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={profile.completedSteps.length}
            aria-valuemax={timelineData.length}
            aria-label="Timeline progress"
          />
        </div>
      </div>

      <div className={styles.steps} role="list" aria-live="polite">
        {timelineData.map((step) => (
          <StepCard
            key={step.number}
            step={step}
            isHighlighted={step.isHighlighted}
            isCompleted={step.isCompleted}
            isActive={activeStep === step.number}
            badge={step.badge}
            nriNote={step.nriNote}
            onToggleComplete={toggleStep}
            onWatchGuide={onWatchGuide}
            onAddToCalendar={onAddToCalendar}
          />
        ))}
      </div>
    </section>
  );
}
