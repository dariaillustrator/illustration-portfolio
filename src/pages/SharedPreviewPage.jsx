import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Loader2, ChevronLeft, ChevronRight, X, 
  Archive, AlertCircle, Eye, ShieldAlert, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';

// Simple cross-device file save helper
function saveAs(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SharedPreviewPage() {
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [artworks, setArtworks] = useState([]);
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  // Lightbox state
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [displayIdx, setDisplayIdx] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(1);

  // Responsive state
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch shared collection configuration & items
  useEffect(() => {
    let isMounted = true;

    async function fetchSharedData() {
      try {
        setIsLoading(true);
        setError('');

        // 1. Fetch the shared link configuration row
        const { data: shareData, error: shareError } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('title', `__site_shared_link__:${token}`)
          .maybeSingle();

        if (shareError) throw shareError;
        if (!shareData) {
          if (isMounted) {
            setError('This shared link does not exist or has expired.');
            setIsLoading(false);
          }
          return;
        }

        let config;
        try {
          config = JSON.parse(shareData.src);
        } catch (e) {
          throw new Error('Failed to parse share configuration');
        }

        const { item_ids, allow_download } = config;
        if (isMounted) {
          setAllowDownload(!!allow_download);
        }

        // 2. Fetch all gallery items to get settings and images
        const { data: allItems, error: itemsError } = await supabase
          .from('gallery_items')
          .select('*');

        if (itemsError) throw itemsError;
        if (!allItems) throw new Error('No items found');

        // Extract settings for sorting
        const settingsItem = allItems.find(item => item.title === '__site_settings__');
        let mode = 'chromatic_asc';
        if (settingsItem) {
          if (settingsItem.hue === 1.0) mode = 'chromatic_desc';
          else if (settingsItem.hue === 2.0) mode = 'manual';
        }

        // Extract shared items
        let sharedList = [];
        if (item_ids.includes('*')) {
          // Share all active live items
          sharedList = allItems.filter(item => !item.title.startsWith('__site_') && !item.is_parked);
        } else {
          // Share specific list of item IDs
          sharedList = allItems.filter(item => item_ids.includes(item.id));
        }

        // Format and sort shared items
        const formattedList = sharedList.map(item => ({
          id: item.id,
          title: item.title,
          year: item.created_at ? new Date(item.created_at).getFullYear().toString() : '2026',
          imgUrl: item.src,
          aspectRatio: item.aspect_ratio || 1,
          hue: item.hue,
          saturation: item.saturation,
          lightness: item.lightness,
          custom_order: item.custom_order
        }));

        // Sort items
        const sortedList = sortItems(formattedList, mode);

        if (isMounted) {
          setArtworks(sortedList);
        }
      } catch (err) {
        console.error('Failed to load shared page data:', err);
        if (isMounted) {
          setError(err.message || 'An error occurred while loading this page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSharedData();
    return () => { isMounted = false; };
  }, [token]);

  // Sort function matching homepage logic
  const sortItems = (list, mode) => {
    if (mode === 'manual') {
      return [...list].sort((a, b) => {
        const orderA = a.custom_order !== null && a.custom_order !== undefined ? a.custom_order : Infinity;
        const orderB = b.custom_order !== null && b.custom_order !== undefined ? b.custom_order : Infinity;
        return orderA - orderB;
      });
    }

    const isInverted = mode === 'chromatic_desc';
    return [...list].sort((a, b) => {
      const hA = a.hue ?? 0;
      const hB = b.hue ?? 0;
      const sA = a.saturation ?? 0;
      const sB = b.saturation ?? 0;
      const lA = a.lightness ?? 0;
      const lB = b.lightness ?? 0;
      
      if (hA !== hB) return isInverted ? hB - hA : hA - hB;
      if (sA !== sB) return isInverted ? sB - sA : sA - sB;
      return isInverted ? lB - lA : lA - lB;
    });
  };

  // Grid layout calculation matching Gallery.jsx
  const masonryLayout = useMemo(() => {
    let numCols = 3;
    if (windowWidth < 768) numCols = 1;
    else if (windowWidth < 1024) numCols = 2;

    const cols = Array.from({ length: numCols }, () => []);
    
    // Distribute items sequentially across columns to balance heights dynamically
    artworks.forEach((art, idx) => {
      cols[idx % numCols].push(art);
    });
    
    return cols;
  }, [artworks, windowWidth]);

  // Lightbox handlers
  useEffect(() => {
    if (selectedIdx !== null) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }
    return () => document.body.classList.remove('lightbox-open');
  }, [selectedIdx]);

  useEffect(() => {
    if (selectedIdx === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeIsland();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, artworks.length]);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) next();
    else if (isRightSwipe) prev();
  };

  const openIsland = (id) => {
    const idx = artworks.findIndex(a => a.id === id);
    setSelectedIdx(idx);
    setDisplayIdx(idx);
    setImageOpacity(1);
  };

  const next = (e) => {
    if (e) e.stopPropagation();
    setSelectedIdx(prev => {
      if (prev !== null && prev < artworks.length - 1) return prev + 1;
      return prev;
    });
  };

  const prev = (e) => {
    if (e) e.stopPropagation();
    setSelectedIdx(prev => {
      if (prev !== null && prev > 0) return prev - 1;
      return prev;
    });
  };

  const closeIsland = () => {
    setSelectedIdx(null);
    setDisplayIdx(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // ZIP Download Handler
  const handleDownloadCollection = async () => {
    if (isDownloading || !allowDownload) return;
    setIsDownloading(true);
    setDownloadProgress('Preparing files...');

    try {
      const zip = new JSZip();
      let downloaded = 0;

      for (const art of artworks) {
        try {
          setDownloadProgress(`Downloading ${downloaded + 1}/${artworks.length}: ${art.title || 'illustration'}`);
          const filename = art.imgUrl.split('/').pop() || `${art.title || 'artwork'}.jpg`;
          
          const res = await fetch(`${art.imgUrl}?cache-bust=${Date.now()}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(filename, blob);
          }
          downloaded++;
        } catch (err) {
          console.warn(`Skipping download for ${art.title}:`, err);
          downloaded++;
        }
      }

      setDownloadProgress('Compressing files...');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `daria-collection-${token}.zip`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  const handleDownloadSingle = async (e, art) => {
    e.stopPropagation();
    if (!allowDownload) return;
    
    try {
      const filename = art.imgUrl.split('/').pop() || `${art.title || 'artwork'}.jpg`;
      const response = await fetch(`${art.imgUrl}?cache-bust=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (fetchErr) {
      console.warn("Direct download failed, opening in new tab", fetchErr);
      window.open(art.imgUrl, '_blank');
    }
  };

  const springConfig = { type: 'spring', stiffness: 350, damping: 35, mass: 1 };

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#a855f7' }} />
        <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.9rem', opacity: 0.8 }}>Loading Shared Collection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 500, marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Collection Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', marginBottom: '2rem', lineHeight: 1.5 }}>{error}</p>
        <Link to="/" className="request-submit-btn" style={{ textDecoration: 'none' }}>
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
      <style>{`
        .shared-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2rem;
          margin-bottom: 4rem;
          margin-top: 2rem;
        }

        .shared-title-group h1 {
          font-family: var(--font-editorial);
          font-size: 3rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .shared-subtitle {
          font-family: var(--font-main);
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .shared-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .masonry-columns {
          display: flex;
          gap: 2rem;
          margin: 2rem auto 0;
          width: 100%;
        }

        .masonry-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .shared-card {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .shared-card:hover {
          border-color: var(--text-primary);
          transform: translateY(-4px);
        }

        .shared-card-img {
          width: 100%;
          display: block;
          transition: transform 0.3s ease;
        }

        .shared-card:hover .shared-card-img {
          transform: scale(1.02);
        }

        /* Hover Overlay Styles */
        .card-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 5;
        }

        .shared-card:hover .card-overlay {
          opacity: 1;
        }

        .overlay-title {
          color: white;
          font-family: var(--font-main);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .overlay-meta {
          color: rgba(255,255,255,0.70);
          font-family: var(--font-main);
          font-size: 0.8rem;
          margin-top: 0.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .single-download-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          transition: all 0.2s ease;
        }

        .single-download-btn:hover {
          background: white;
          color: black;
        }

        /* Custom download overlay loader */
        .download-loading-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 15000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: white;
          font-family: var(--font-main);
        }

        .download-loading-card {
          background: #1c1c1e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2.5rem;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        @media (max-width: 1024px) {
          .masonry-columns { gap: 1.5rem; }
          .masonry-col { gap: 1.5rem; }
        }

        @media (max-width: 768px) {
          .shared-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
          .shared-title-group h1 { font-size: 2.2rem; }
          .masonry-columns { gap: 1rem; }
          .masonry-col { gap: 1rem; }
        }
      `}</style>

      {/* Shared Header block */}
      <div className="shared-header animate-fade-in">
        <div className="shared-title-group">
          <h1 style={{ fontSize: '2.5rem' }}>Daria shared the following illustrations with you.</h1>
          <div className="shared-subtitle">
            <Sparkles size={14} style={{ color: '#a855f7' }} />
            <span>Shared Collection Preview ({artworks.length} items)</span>
            {!allowDownload && (
              <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: 'var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                <Eye size={10} /> View Only
              </span>
            )}
          </div>
        </div>

        <div className="shared-actions">
          {allowDownload ? (
            <button 
              onClick={handleDownloadCollection}
              disabled={isDownloading}
              className="request-submit-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                margin: 0, padding: '0.6rem 1.4rem', border: '1px solid var(--text-primary)',
                background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px'
              }}
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Downloading ZIP...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Collection (ZIP)
                </>
              )}
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Eye size={14} /> Download disabled by creator
            </span>
          )}
        </div>
      </div>

      {/* Grid gallery */}
      {artworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>This collection has no illustrations.</p>
        </div>
      ) : (
        <motion.div 
          className="masonry-columns"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {masonryLayout.map((col, colIdx) => (
            <div key={colIdx} className="masonry-col">
              <AnimatePresence mode="popLayout">
                {col.map((art) => (
                  <motion.div 
                    key={art.id} 
                    layout 
                    whileHover={{ scale: 1.01, y: -4 }}
                    transition={springConfig}
                    onClick={() => openIsland(art.id)}
                    className="shared-card"
                  >
                    {/* Visual protection - prevent dragging */}
                    <img 
                      src={art.imgUrl} 
                      alt={art.title || 'Illustration'} 
                      className="shared-card-img" 
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      style={!allowDownload ? { userSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } : undefined}
                    />

                    {/* Card Hover details */}
                    <div className="card-overlay" style={!allowDownload ? { pointerEvents: 'none' } : undefined}>
                      <span className="overlay-title">{art.title || 'Untitled'}</span>
                      <div className="overlay-meta">
                        <span>{art.year}</span>
                        {allowDownload && (
                          <button 
                            className="single-download-btn"
                            onClick={(e) => handleDownloadSingle(e, art)}
                            title="Download artwork"
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}

      {/* Full-Screen Lightbox */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div 
            className="floating-island-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeIsland}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Premium Floating Close Button */}
            <motion.button 
              className="island-close" 
              onClick={(e) => {
                e.stopPropagation();
                closeIsland();
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              aria-label="Close lightbox"
            >
              <X size={24} />
            </motion.button>

            {/* Left Nav Button */}
            <button 
              onClick={(e) => prev(e)} 
              disabled={selectedIdx === 0} 
              className="island-nav-arrow left"
              aria-label="Previous illustration"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Right Nav Button */}
            <button 
              onClick={(e) => next(e)} 
              disabled={selectedIdx === artworks.length - 1} 
              className="island-nav-arrow right"
              aria-label="Next illustration"
            >
              <ChevronRight size={24} />
            </button>

            {/* Clean Centered Image Wrapper with Elastic Drag to Dismiss */}
            <motion.div 
              className="floating-island-image-wrapper"
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springConfig}
              onClick={(e) => e.stopPropagation()}
              
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 300) {
                  closeIsland();
                }
              }}
            >
              {displayIdx !== null && artworks[displayIdx] && (
                <motion.img 
                  src={artworks[displayIdx].imgUrl} 
                  alt={artworks[displayIdx].title || 'Illustration'} 
                  className="island-image-clean"
                  animate={{ opacity: imageOpacity }}
                  transition={{
                    opacity: { duration: 0.25 },
                    layout: springConfig
                  }}
                  layout
                  draggable={false}
                  onLoad={() => setImageOpacity(1)}
                  onError={() => setImageOpacity(1)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={!allowDownload ? { userSelect: 'none', pointerEvents: 'none', WebkitUserDrag: 'none' } : undefined}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress modal overlay when downloading Zip */}
      {isDownloading && (
        <div className="download-loading-overlay animate-fade-in">
          <div className="download-loading-card">
            <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite', color: '#a855f7', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1.2rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Creating ZIP Archive</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.4 }}>
              {downloadProgress}
            </p>
          </div>
        </div>
      )}

      {/* Return Home Button */}
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem' }}>
        <Link to="/" className="request-submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.8rem 2rem', fontSize: '1rem' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
