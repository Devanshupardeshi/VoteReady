/**
 * BoothLocator — Google Maps Embed API integration
 *
 * Shows nearby polling booths via Google Maps embed.
 * Input: Text address OR browser geolocation
 * Fallback: If geolocation denied → show address search box
 * Disclaimer: "Verify your booth at eci.gov.in"
 */
import { useState, useCallback, useEffect } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import styles from './BoothLocator.module.css';

export default function BoothLocator() {
  const { profile } = useVoterProfile();
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  /** Use browser geolocation */
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const query = `polling+booth+near+${latitude},${longitude}`;
        setSearchQuery(query);
        setHasSearched(true);
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please allow location permissions in your browser or use the search box.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable on this device. Please enter your address.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please enter your address manually.');
            break;
          default:
            setLocationError(`Unable to get location (Error ${error.code}: ${error.message}). Please enter your address.`);
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  /** Search by address */
  const handleAddressSearch = useCallback((e) => {
    if (e) e.preventDefault();
    if (address.trim()) {
      // Since 'polling booth' isn't always indexed by Google Maps outside election day, 
      // search for schools, which act as the official polling stations in India.
      const query = `schools+near+${encodeURIComponent(address.trim())}+${encodeURIComponent(profile.constituency || profile.state)}`;
      setSearchQuery(query);
      setHasSearched(true);
      setLocationError('');
    }
  }, [address, profile]);

  // Auto-initialize map with user's detected profile location (constituency/state) if they haven't searched yet
  useEffect(() => {
    if (!hasSearched && apiKey && (profile.constituency || profile.state)) {
      const query = `schools+in+${encodeURIComponent(profile.constituency || profile.state)}`;
      setSearchQuery(query);
      setHasSearched(true);
    }
  }, [hasSearched, apiKey, profile]);

  const mapUrl = apiKey && searchQuery
    ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchQuery}&zoom=15`
    : '';

  return (
    <section className={styles.boothLocator} aria-label="Polling Booth Finder">
      <div className={styles.header}>
        <h2 className={styles.title}>Find Your Polling Booth</h2>
        <p className={styles.subtitle}>
          Locate the nearest polling station in {profile.state || 'your area'}
        </p>
      </div>

      {/* Location methods */}
      <div className={styles.methods}>
        <button
          className="btn btn-primary"
          onClick={handleGeolocation}
          disabled={locationLoading || !apiKey}
          aria-label="Use my current location to find polling booths"
        >
          {locationLoading ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          )}
          {locationLoading ? 'Getting location...' : 'Use My Location'}
        </button>

        <span className={styles.dividerText}>or search by address</span>

        <form className={styles.searchForm} onSubmit={handleAddressSearch}>
          <label htmlFor="booth-address" className="sr-only">Enter your address or area</label>
          <input
            id="booth-address"
            type="text"
            className={`input ${styles.searchInput}`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address, area, or pincode..."
            aria-label="Enter your address to find polling booths"
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!address.trim() || !apiKey}
            aria-label="Search for polling booths"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search
          </button>
        </form>
      </div>

      {/* Error */}
      {locationError && (
        <div className={styles.error} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {locationError}
        </div>
      )}

      {/* API key warning */}
      {!apiKey && (
        <div className={styles.warning} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.
        </div>
      )}

      {/* Map embed */}
      {hasSearched && mapUrl && (
        <div className={styles.mapContainer}>
          <iframe
            className={styles.mapFrame}
            title="Polling booth locations near you"
            src={mapUrl}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {/* Placeholder when no search */}
      {!hasSearched && apiKey && (
        <div className={styles.placeholder}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>Use your location or enter an address to find nearby polling booths</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Verify your official polling booth at{' '}
          <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer">eci.gov.in</a>
        </span>
      </div>
    </section>
  );
}
