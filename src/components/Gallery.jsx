import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Artworks sorted by color analysis (Hue-based) with their aspect ratios
const galleryFiles = [
  { src: "photo-output_1.JPG", aspectRatio: 0.927734375 },
  { src: "Horse.JPG", aspectRatio: 1.0 },
  { src: "Comet.JPG", aspectRatio: 0.7754982415005862 },
  { src: "Game.JPG", aspectRatio: 0.8407437348423605 },
  { src: "Dance.JPG", aspectRatio: 0.8258258258258259 },
  { src: "View.jpg", aspectRatio: 1.8654970760233918 },
  { src: "Reflection.JPG", aspectRatio: 0.7990463215258855 },
  { src: "Fish.JPG", aspectRatio: 0.6987594390507011 },
  { src: "Dream.JPG", aspectRatio: 1.0 },
  { src: "Thoughts.JPG", aspectRatio: 1.0 },
  { src: "Home.JPG", aspectRatio: 1.0 },
  { src: "Lights.jpg", aspectRatio: 1.0292902066486973 },
  { src: "Idea.JPG", aspectRatio: 0.6730683340777133 },
  { src: "Postcard.JPG", aspectRatio: 1.0 },
  { src: "Growth.jpg", aspectRatio: 1.0 },
  { src: "Curves.JPG", aspectRatio: 0.7224 },
  { src: "Evening.jpg", aspectRatio: 0.8333333333333334 },
  { src: "Afa.jpg", aspectRatio: 0.8333333333333334 },
  { src: "Memory.jpg", aspectRatio: 0.7172911240232418 },
  { src: "Leaf.JPG", aspectRatio: 0.8333333333333334 },
  { src: "Dancing_Shadow.JPG", aspectRatio: 1.0 },
  { src: "Papavero.JPG", aspectRatio: 1.4123456790123456 },
  { src: "Frame.jpg", aspectRatio: 0.7275 },
  { src: "Beating_Light.jpg", aspectRatio: 1.0 },
  { src: "Innocence.jpg", aspectRatio: 0.7275 },
  { src: "Thread.JPG", aspectRatio: 0.75 },
  { src: "Morning.JPG", aspectRatio: 1.035806953814219 },
  { src: "Dive.JPG", aspectRatio: 0.718 },
  { src: "Wind.JPG", aspectRatio: 1.5103806228373702 },
  { src: "Night.JPG", aspectRatio: 0.9704176334106729 },
  { src: "Blue.jpg", aspectRatio: 0.9647749510763209 },
  { src: "Shell.JPG", aspectRatio: 1.3321364452423698 },
  { src: "Spiral.JPG", aspectRatio: 0.8136 },
  { src: "Mary_Moss.JPG", aspectRatio: 1.0 },
  { src: "The_Sun.jpg", aspectRatio: 1.5794947994056463 },
  { src: "Fragility.JPG", aspectRatio: 0.8326206475259621 },
  { src: "Le_Grand_Meaulnes.jpg", aspectRatio: 0.6123456790123457 }
];

const staticArtworks = galleryFiles.map((fileData, index) => {
  let title = fileData.src.split('.')[0]
    .replace(/Untitled_Artwork/g, 'Artwork')
    .replace(/_/g, ' ')
    .replace(/IMG /g, 'Illustration ')
    .trim();
  
  return {
    id: index + 1,
    title: title,
    year: '2026',
    medium: 'Fine Art Print',
    category: 'Illustration',
    imgUrl: `/gallery/${fileData.src}`,
    description: 'Part of the archival collection exploring nature and ethereal forms.',
    aspectRatio: fileData.aspectRatio
  };
});

export default function Gallery() {
  const [artworks, setArtworks] = useState(staticArtworks);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [displayIdx, setDisplayIdx] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const location = useLocation();
  const skipDelay = location.state?.skipIntroDelay;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortArtworks = (list) => {
    return [...list].sort((a, b) => {
      // 1. Sort by custom_order first if present
      const orderA = a.custom_order;
      const orderB = b.custom_order;
      
      if (orderA !== null && orderA !== undefined && orderB !== null && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== null && orderA !== undefined) return -1;
      if (orderB !== null && orderB !== undefined) return 1;

      // 2. Fallback to chromatic sort
      const hA = a.hue ?? 0;
      const hB = b.hue ?? 0;
      const sA = a.saturation ?? 0;
      const sB = b.saturation ?? 0;
      const lA = a.lightness ?? 0;
      const lB = b.lightness ?? 0;
      
      if (hA !== hB) return hA - hB;
      if (sA !== sB) return sA - sB;
      return lA - lB;
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function loadArtworks() {
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0 && isMounted) {
          const loaded = data.map((item) => ({
            id: item.id,
            title: item.title,
            year: item.created_at ? new Date(item.created_at).getFullYear().toString() : '2026',
            medium: 'Fine Art Print',
            category: 'Illustration',
            imgUrl: item.src,
            description: 'Part of the archival collection exploring nature and ethereal forms.',
            aspectRatio: item.aspect_ratio,
            hue: item.hue,
            saturation: item.saturation,
            lightness: item.lightness,
            custom_order: item.custom_order
          }));
          setArtworks(sortArtworks(loaded));
        }
      } catch (err) {
        console.warn("Failed to load artworks from Supabase database. Falling back to static local assets:", err.message);
      }
    }

    loadArtworks();

    // Subscribe to real-time database changes
    const channel = supabase
      .channel('gallery_changes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_items' }, (payload) => {
        if (!isMounted) return;
        
        if (payload.eventType === 'INSERT') {
          const newItem = {
            id: payload.new.id,
            title: payload.new.title,
            year: payload.new.created_at ? new Date(payload.new.created_at).getFullYear().toString() : '2026',
            medium: 'Fine Art Print',
            category: 'Illustration',
            imgUrl: payload.new.src,
            description: 'Part of the archival collection exploring nature and ethereal forms.',
            aspectRatio: payload.new.aspect_ratio,
            hue: payload.new.hue,
            saturation: payload.new.saturation,
            lightness: payload.new.lightness,
            custom_order: payload.new.custom_order
          };
          setArtworks((prev) => {
            if (prev.some(item => item.id === newItem.id)) return prev;
            return sortArtworks([...prev, newItem]);
          });
        } else if (payload.eventType === 'DELETE') {
          setArtworks((prev) => prev.filter(item => item.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setArtworks((prev) => {
            const updated = prev.map(item => {
              if (item.id === payload.new.id) {
                return {
                  ...item,
                  title: payload.new.title,
                  imgUrl: payload.new.src,
                  aspectRatio: payload.new.aspect_ratio,
                  hue: payload.new.hue,
                  saturation: payload.new.saturation,
                  lightness: payload.new.lightness,
                  custom_order: payload.new.custom_order
                };
              }
              return item;
            });
            return sortArtworks(updated);
          });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Preload and decode all gallery images during intro to prevent scroll jank
    artworks.forEach((art) => {
      const img = new Image();
      img.src = art.imgUrl;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }, [artworks]);

  // Preload and transition target image on selection change
  useEffect(() => {
    if (selectedIdx === null) {
      setDisplayIdx(null);
      return;
    }
    if (displayIdx === null) {
      setDisplayIdx(selectedIdx);
      return;
    }
    if (selectedIdx === displayIdx) return;

    // 1. Immediately start fading out the current image
    setImageOpacity(0);

    let isCancelled = false;
    let swapTimer;
    let fallbackTimer;

    // 2. Start preloading & decoding the new image in background
    const img = new Image();
    img.src = artworks[selectedIdx].imgUrl;

    const performSwap = () => {
      if (isCancelled) return;
      setDisplayIdx(selectedIdx);
    };

    // We want the fade-out to last at least 250ms before swapping.
    const startTime = Date.now();

    const onImageReady = () => {
      if (isCancelled) return;
      clearTimeout(fallbackTimer);
      
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 250 - elapsed);
      
      // Swap only after the 250ms fade-out has completed
      swapTimer = setTimeout(performSwap, remainingTime);
    };

    if (typeof img.decode === 'function') {
      img.decode()
        .then(() => {
          onImageReady();
        })
        .catch(() => {
          img.onload = onImageReady;
        });
    } else {
      img.onload = onImageReady;
    }

    // Safety fallback (in case it fails to load or decode)
    fallbackTimer = setTimeout(onImageReady, 400);

    return () => {
      isCancelled = true;
      img.onload = null;
      clearTimeout(swapTimer);
      clearTimeout(fallbackTimer);
    };
  }, [selectedIdx, displayIdx]);

  const colCount = windowWidth < 768 ? 2 : 3;
  const columns = Array.from({ length: colCount }, () => []);
  const columnHeights = Array.from({ length: colCount }, () => 0);
  
  artworks.forEach((art) => {
    let shortestColIdx = 0;
    let minHeight = columnHeights[0];
    for (let i = 1; i < colCount; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        shortestColIdx = i;
      }
    }
    
    columns[shortestColIdx].push(art);
    // Relative height is 1 / aspectRatio
    columnHeights[shortestColIdx] += (1 / art.aspectRatio);
  });

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
      if (e.key === 'Escape') {
        closeIsland();
      } else if (e.key === 'ArrowRight') {
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx]);

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

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  const openIsland = (id) => {
    const idx = artworks.findIndex(a => a.id === id);
    setSelectedIdx(idx);
    setDisplayIdx(idx);
    setImageOpacity(1);
  };

  const next = (e) => {
    if (e) e.stopPropagation();
    if (selectedIdx !== null && selectedIdx < artworks.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };

  const prev = (e) => {
    if (e) e.stopPropagation();
    if (selectedIdx !== null && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const closeIsland = () => {
    setSelectedIdx(null);
    setDisplayIdx(null);
  };

  const springConfig = { type: "spring", stiffness: 350, damping: 35, mass: 1 };

  return (
    <motion.section 
      id="gallery" 
      className="gallery-section"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: skipDelay ? 0.4 : 1.5, 
        delay: skipDelay ? 0 : 2, 
        ease: [0.22, 1, 0.36, 1] 
      }}
    >
      <style>{`
        .masonry-columns {
          display: flex;
          gap: 2rem;
          margin: 6rem auto 0;
          padding-left: 4rem;
          padding-right: 4rem;
          padding-bottom: 2rem;
        }
        .masonry-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        @media (max-width: 1024px) {
          .masonry-columns { 
            gap: 1.5rem; 
            padding-left: 3rem;
            padding-right: 3rem;
            padding-bottom: 1.5rem;
          }
          .masonry-col { gap: 1.5rem; }
        }
        @media (max-width: 768px) {
          .masonry-columns { 
            gap: 0.8rem; 
            padding-left: 1rem;
            padding-right: 1rem;
            padding-bottom: 1rem;
            margin-top: 4rem;
          }
          .masonry-col { gap: 0.8rem; }
        }
      `}</style>

      <motion.div 
        className="masonry-columns"
        style={{
          width: '100%'
        }}
      >
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="masonry-col">
            <AnimatePresence mode="popLayout">
              {col.map((art, itemIdx) => (
                <motion.div 
                  key={art.id} 
                  layout 
                  exit={{ opacity: 0, scale: 0.9 }} 
                  whileHover={{ scale: 1.01, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ 
                    ...springConfig, 
                    layout: { duration: 0.4 } 
                  }}
                  onClick={() => openIsland(art.id)}
                  className="gallery-card clean-card"
                  style={{ 
                    aspectRatio: art.aspectRatio
                  }}
                >
                  <div className="gallery-item">
                    <motion.img 
                      src={art.imgUrl}
                      alt={art.title}
                      className="gallery-image"
                      loading="eager"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

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
            {/* Premium Floating Close Button matching shared-element-gallery */}
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
              aria-label="Close gallery"
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
                // Dismiss if dragged vertically beyond threshold or velocity
                if (
                  Math.abs(info.offset.y) > 100 ||
                  Math.abs(info.velocity.y) > 300
                ) {
                  closeIsland();
                }
              }}
            >
              {displayIdx !== null && (
                <motion.img 
                  src={artworks[displayIdx].imgUrl} 
                  alt={artworks[displayIdx].title}
                  className="island-image-clean"
                  animate={{ opacity: imageOpacity }}
                  transition={{
                    opacity: { duration: 0.25 },
                    layout: springConfig
                  }}
                  style={{
                    aspectRatio: artworks[displayIdx].aspectRatio
                  }}
                  layout
                  draggable={false}
                  onLoad={() => setImageOpacity(1)}
                  onError={() => setImageOpacity(1)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
