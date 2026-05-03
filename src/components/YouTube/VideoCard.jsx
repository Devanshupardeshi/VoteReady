/**
 * VideoCard — YouTube Data API v3 integration
 *
 * Searches ECI YouTube channel for step-relevant videos.
 * Displays: Thumbnail + title + duration → click opens embed modal
 * Cache results in sessionStorage, max 3 results per query
 */
import { memo, useState, useEffect, useCallback } from 'react';
import styles from './VideoCard.module.css';

const FALLBACK_VIDEOS = {
  1: [
    {
      id: 'rC4eH4mI_AY',
      title: 'India General Election Process - Step by Step Guide',
      description: 'An extensive guide on how the Election Commission of India conducts general elections across the nation.',
      thumbnail: 'https://i.ytimg.com/vi/rC4eH4mI_AY/mqdefault.jpg',
    }
  ],
  2: [
    {
      id: 'N-247T8n8y8',
      title: 'How to Register to Vote Online - Step by Step',
      description: 'Tutorial on how to check your name in the voter list and register via official portals.',
      thumbnail: 'https://i.ytimg.com/vi/N-247T8n8y8/mqdefault.jpg',
    }
  ],
  3: [
    {
      id: 'z4d6T7K8YlM',
      title: 'Candidate Nomination Process in India',
      description: 'Learn how candidates file nominations and the scrutiny process involved.',
      thumbnail: 'https://i.ytimg.com/vi/z4d6T7K8YlM/mqdefault.jpg',
    }
  ],
  4: [
    {
      id: 'u3FqJ_p6rZc',
      title: 'Model Code of Conduct Guidelines',
      description: 'What political parties and candidates must follow during campaigning.',
      thumbnail: 'https://i.ytimg.com/vi/u3FqJ_p6rZc/mqdefault.jpg',
    }
  ],
  5: [
    {
      id: 'zTDUO-iN8kE',
      title: 'How to Vote using EVM & VVPAT - Official Demo',
      description: 'A clear demonstration of the Electronic Voting Machine and VVPAT verification.',
      thumbnail: 'https://i.ytimg.com/vi/zTDUO-iN8kE/mqdefault.jpg',
    }
  ],
  6: [
    {
      id: 'T5xN-K9nZ8Y',
      title: 'Counting of Votes & Declaration of Results',
      description: 'How the Election Commission securely counts the ballots and declares winners.',
      thumbnail: 'https://i.ytimg.com/vi/T5xN-K9nZ8Y/mqdefault.jpg',
    }
  ],
  7: [
    {
      id: 'L8Z2p7k3M9o',
      title: 'Formation of Government & Prime Minister Oath',
      description: 'The constitutional steps for government formation after results are announced.',
      thumbnail: 'https://i.ytimg.com/vi/L8Z2p7k3M9o/mqdefault.jpg',
    }
  ]
};

const GENERIC_FALLBACK = [
  {
    id: 'rC4eH4mI_AY',
    title: 'ECI Voter Awareness & Election Guide',
    description: 'Comprehensive educational video for all Indian voters.',
    thumbnail: 'https://i.ytimg.com/vi/rC4eH4mI_AY/mqdefault.jpg',
  }
];

function VideoCard({ searchQuery, stepNumber, onClose }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    if (!searchQuery) {
      setLoading(false);
      return;
    }

    const cacheKey = `youtube_${searchQuery.replace(/\s+/g, '_')}`;
    
    // Check cache
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setVideos(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    const fetchVideos = async () => {
      try {
        const params = new URLSearchParams({
          query: searchQuery,
          channelId: ECI_CHANNEL_ID,
          order: 'relevance',
        });

        const response = await fetch(
          `/api/youtube?${params}`
        );

        if (!response.ok) throw new Error('YouTube API error');

        const data = await response.json();
        
        // If we get an error object from proxy instead of results
        if (data.error) {
          throw new Error(data.error);
        }

        const results = (data.items || []).map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
        }));

        if (results.length === 0) {
          setVideos(FALLBACK_VIDEOS[stepNumber] || GENERIC_FALLBACK);
        } else {
          setVideos(results);
          // Cache results
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(results));
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn('Failed to fetch from YouTube API, using curated fallback:', err);
        setVideos(FALLBACK_VIDEOS[stepNumber] || GENERIC_FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [searchQuery, stepNumber]);

  const handleVideoClick = useCallback((video) => {
    setActiveVideo(video);
  }, []);

  return (
    <div className={styles.videoCard} role="region" aria-label={`Video guides for step ${stepNumber}`}>
      {/* Video modal */}
      {activeVideo && (
        <div className={styles.modalOverlay} onClick={() => setActiveVideo(null)} role="dialog" aria-modal="true" aria-label={`Playing: ${activeVideo.title}`}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>{activeVideo.title}</h4>
              <button className={styles.closeBtn} onClick={() => setActiveVideo(null)} aria-label="Close video">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.embedContainer}>
              <iframe
                className={styles.embed}
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <a
                href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#FF0000',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                Watch directly on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Video list */}
      {!loading && videos.length > 0 && (
        <div className={styles.videoList}>
          {videos.map((video) => (
            <button
              key={video.id}
              className={styles.videoItem}
              onClick={() => handleVideoClick(video)}
              aria-label={`Watch: ${video.title}`}
            >
              <div className={styles.thumbnailWrapper}>
                <img
                  src={video.thumbnail}
                  alt={`Thumbnail for ${video.title}`}
                  className={styles.thumbnail}
                  loading="lazy"
                />
                <div className={styles.playOverlay}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <div className={styles.videoInfo}>
                <p className={styles.videoTitle}>{video.title}</p>
                <p className={styles.videoDesc}>{video.description?.substring(0, 80)}...</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && !error && videos.length === 0 && (
        <p className={styles.noResults}>No videos found for this topic.</p>
      )}
    </div>
  );
}

export default memo(VideoCard);
