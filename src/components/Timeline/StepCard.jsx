/**
 * StepCard — Individual step in the Election Timeline
 *
 * Shows step number, title, description, status badge
 * "Watch Guide" button → YouTube integration
 * "Add to Calendar" button → Calendar integration
 * Expand/collapse with animation
 */
import { memo, useState } from 'react';
import styles from './StepCard.module.css';

function StepCard({
  step,
  isHighlighted,
  isCompleted,
  isActive,
  badge,
  onToggleComplete,
  onWatchGuide,
  onAddToCalendar,
  nriNote,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`${styles.stepCard} ${isHighlighted ? styles.highlighted : ''} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
      role="listitem"
    >
      {/* Step indicator line */}
      <div className={styles.indicator}>
        <div className={`${styles.dot} ${isCompleted ? styles.dotCompleted : ''} ${isActive ? styles.dotActive : ''}`}>
          {isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className={styles.stepNum}>{step.number}</span>
          )}
        </div>
        <div className={styles.line} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h3 className={styles.title}>{step.title}</h3>
            {badge && (
              <span className={`badge ${badge === 'Action Required' ? 'badge-orange' : 'badge-blue'}`}>
                {badge === 'Action Required' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {badge}
              </span>
            )}
          </div>
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${step.title}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <p className={styles.subtitle}>{step.subtitle}</p>

        {/* Expanded detail */}
        {expanded && (
          <div className={styles.detail} role="region" aria-label={`Details for ${step.title}`}>
            <p className={styles.detailText}>{step.detail}</p>

            {nriNote && (
              <div className={styles.nriNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{nriNote}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onWatchGuide && onWatchGuide(step.number)}
                aria-label={`Watch video guide for ${step.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Guide
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onAddToCalendar && onAddToCalendar(step)}
                aria-label={`Add ${step.title} to your calendar`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Add to Calendar
              </button>
              <button
                className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => onToggleComplete && onToggleComplete(step.number)}
                aria-label={isCompleted ? `Mark ${step.title} as incomplete` : `Mark ${step.title} as complete`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isCompleted ? 'Completed' : 'Mark Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StepCard);
