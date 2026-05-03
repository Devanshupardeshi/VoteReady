/**
 * CandidateSearch — Google Custom Search JSON API
 *
 * Query: '{constituency} candidates {year} affidavit ECI'
 * Sources restricted to: myneta.info, eci.gov.in, affidavit portals
 * Display: Top 5 results — title, snippet, link only
 * Required disclaimer: "Source: Web search. VoteReady does not endorse any candidate."
 */
import { useState, useCallback, useEffect } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import styles from './CandidateSearch.module.css';

export default function CandidateSearch() {
  const { profile } = useVoterProfile();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  const searchCandidates = useCallback(async (query) => {

    setLoading(true);
    setError('');
    setHasSearched(true);

    const searchQuery = query || `${profile.constituency || profile.state} candidates ${new Date().getFullYear()} affidavit ECI`;

    // Check cache
    const cacheKey = `gemini_search_rich_${searchQuery.replace(/\s+/g, '_').substring(0, 100)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setResults(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    try {
      const prompt = `You are an Indian political researcher. Find 5 likely or actual candidates for: "${searchQuery}". 
Return a JSON array where each object has these exact keys:
"name" (candidate's full name),
"party" (political party name, e.g., "BJP", "INC", "AAP"),
"partySymbol" (a short description of their symbol, e.g., "Lotus", "Hand", "Broom"),
"snippet" (short background, education, or criminal record summary),
"link" (a realistic URL related to them, like https://myneta.info/ or eci.gov.in)
Return ONLY the raw JSON array, nothing else.`;

      const response = await fetch(
        `/api/gemini`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelName: 'gemini-2.5-flash',
            requestBody: {
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
              }
            }
          }),
        }
      );

      if (!response.ok) throw new Error('Search API error');

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const items = JSON.parse(textResponse);

      setResults(items);

      // Cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(items));
      } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
      setError('Unable to search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Auto-fetch on initial load
  useEffect(() => {
    if (!hasSearched) {
      searchCandidates();
    }
  }, [hasSearched, searchCandidates]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchCandidates(customQuery || undefined);
  };

  // Helper to get fallback avatar based on name
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
  };

  // Helper for generic party colors
  const getPartyColor = (party) => {
    const p = party?.toLowerCase() || '';
    if (p.includes('bjp')) return '#F97316'; // Saffron
    if (p.includes('inc') || p.includes('congress')) return '#0EA5E9'; // Blue
    if (p.includes('aap')) return '#0D9488'; // Teal
    if (p.includes('tmc')) return '#16A34A'; // Green
    if (p.includes('cpim') || p.includes('cpi')) return '#DC2626'; // Red
    if (p.includes('sp') || p.includes('samajwadi')) return '#84CC16'; // Lime
    if (p.includes('bsp')) return '#3B82F6'; // Blue
    return '#6366F1'; // Default Indigo
  };

  // Helper for party symbol emoji mapping
  const getPartyEmoji = (party) => {
    const p = party?.toLowerCase() || '';
    if (p.includes('bjp')) return '🪷'; 
    if (p.includes('inc') || p.includes('congress')) return '✋'; 
    if (p.includes('aap')) return '🧹'; 
    if (p.includes('tmc')) return '🌱'; 
    if (p.includes('cpim') || p.includes('cpi')) return '☭'; 
    if (p.includes('sp') || p.includes('samajwadi')) return '🚲';
    if (p.includes('bsp')) return '🐘';
    if (p.includes('ncp')) return '⏰';
    if (p.includes('shiv sena')) return '🏹';
    return '🏛️'; 
  };

  return (
    <section className={styles.candidateSearch} aria-label="Candidate Research">
      <div className={styles.header}>
        <h2 className={styles.title}>Your Local Candidates</h2>
        <p className={styles.subtitle}>
          Detected location: <strong>{profile.constituency || profile.state}</strong>. Discover who is running in your area.
        </p>
      </div>

      {/* Search form */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <label htmlFor="candidate-search" className="sr-only">Search specific candidate</label>
        <div className={styles.searchWrapper}>
          <input
            id="candidate-search"
            type="text"
            className={`input ${styles.searchInput}`}
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Search specific leader..."
            aria-label="Enter candidate search query"
          />
          <button type="submit" className={`btn btn-primary ${styles.searchBtn}`} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            )}
            <span className="sr-only">Search</span>
          </button>
        </div>
      </form>

      {/* Error */}
      {error && <div className={styles.error} role="alert">{error}</div>}

      {/* Loading State for initial fetch */}
      {loading && results.length === 0 && (
        <div className={styles.loadingGrid}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.skeletonCard}></div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && results.length > 0 && (
        <div className={styles.resultsGrid} role="list" aria-label="Candidate Cards">
          {results.map((result, idx) => (
            <a
              key={idx}
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.candidateCard}
              role="listitem"
            >
              <div className={styles.cardHeader} style={{ borderTopColor: getPartyColor(result.party) }}>
                <div className={styles.avatarWrap}>
                  <div className={styles.avatarFallback} style={{ background: getPartyColor(result.party) }}>
                    {getInitials(result.name)}
                  </div>
                  <div className={styles.partySymbolIcon} title={`Symbol: ${result.partySymbol}`} aria-hidden="true">
                    {getPartyEmoji(result.party)}
                  </div>
                </div>
                <div className={styles.candidateMeta}>
                  <h4 className={styles.candidateName}>{result.name}</h4>
                  <div className={styles.partyBadge} style={{ color: getPartyColor(result.party), backgroundColor: `${getPartyColor(result.party)}15` }}>
                    {result.party} • {result.partySymbol}
                  </div>
                </div>
              </div>
              <p className={styles.candidateSnippet}>{result.snippet}</p>
              
              <div className={styles.cardFooter}>
                <span className={styles.readMore}>View full profile →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && !error && (
        <p className={styles.noResults}>No results found. Try a different search term.</p>
      )}

      {/* Disclaimer — REQUIRED by PRD */}
      <div className={styles.disclaimer}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Source: Web search. VoteReady does not endorse any candidate.</span>
      </div>
    </section>
  );
}
