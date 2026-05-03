/**
 * AddToCalendar — Google Calendar API v3 + .ics fallback
 *
 * OAuth: Google Identity Services (GIS), scope: calendar.events only
 * Graceful fallback: If OAuth declined → offer .ics file download
 */
import { useState, useCallback } from 'react';
import styles from './AddToCalendar.module.css';

/** Generate .ics file content */
function generateICS(event) {
  const now = new Date();
  const start = event.date || new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0);
  const end = new Date(start.getTime() + 3600000); // 1 hour
  
  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VoteReady//Election Calendar//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    event.location ? `LOCATION:${event.location}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    `UID:${Date.now()}@voteready`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export default function AddToCalendar({ event, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;

  /** Google Calendar API via OAuth */
  const handleGoogleCalendar = useCallback(async () => {
    if (!clientId) {
      setErrorMsg('Google Calendar client ID not configured.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      // Load Google Identity Services
      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: async (response) => {
          if (response.error) {
            setStatus('error');
            setErrorMsg('Google sign-in was cancelled or failed.');
            return;
          }

          try {
            const calendarEvent = {
              summary: event.title,
              description: event.description + '\n\nAdded by VoteReady — Your Election Journey Assistant',
              location: event.location || '',
              start: {
                dateTime: (event.date || new Date()).toISOString(),
                timeZone: 'Asia/Kolkata',
              },
              end: {
                dateTime: new Date((event.date || new Date()).getTime() + 3600000).toISOString(),
                timeZone: 'Asia/Kolkata',
              },
              reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 1440 }], // 24 hours
              },
            };

            const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${response.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(calendarEvent),
            });

            if (res.ok) {
              setStatus('success');
            } else {
              throw new Error('Failed to create event');
            }
          } catch {
            setStatus('error');
            setErrorMsg('Failed to add event to Google Calendar.');
          }
        },
      });

      if (tokenClient) {
        tokenClient.requestAccessToken();
      } else {
        throw new Error('Google Identity Services not loaded');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Google Calendar is not available. Use the download option below.');
    }
  }, [clientId, event]);

  /** Download .ics file */
  const handleICSDownload = useCallback(() => {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voteready-${event.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus('success');
  }, [event]);

  if (!event) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Add event to calendar" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Add to Calendar</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close calendar dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Event preview */}
        <div className={styles.eventPreview}>
          <div className={styles.eventIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p className={styles.eventTitle}>{event.title}</p>
            <p className={styles.eventDesc}>{event.description}</p>
            {event.location && <p className={styles.eventLocation}>{event.location}</p>}
          </div>
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <div className={styles.success} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Event added successfully!
          </div>
        )}

        {status === 'error' && (
          <div className={styles.error} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* Action buttons */}
        {status !== 'success' && (
          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={handleGoogleCalendar} disabled={status === 'loading'}>
              {status === 'loading' ? 'Connecting...' : 'Add to Google Calendar'}
            </button>
            <button className="btn btn-secondary" onClick={handleICSDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download .ics File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
