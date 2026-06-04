import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Image as ImageIcon } from 'lucide-react';
import FadeIn from './FadeIn';

export default function Shop() {
  const [inRoom, setInRoom] = useState(false);

  return (
    <FadeIn id="shop">
      <h2 className="section-headline">Bring the Story Home.</h2>
      <p className="section-copy">
        Museum-quality Giclée prints, fulfilled by Gelato.com. Carbon-neutral shipping, global delivery.
      </p>
      
      <div className="shop-item" style={{ borderRadius: 'var(--radius-lg)' }}>
        <button className="room-toggle" onClick={() => setInRoom(!inRoom)}>
          {inRoom ? <ImageIcon size={16} /> : <Maximize size={16} />}
          {inRoom ? 'View Artwork' : 'View in Room'}
        </button>
        <AnimatePresence mode="wait">
          <motion.img 
            key={inRoom ? 'room' : 'flat'}
            src="/final.png"
            alt="Print"
            className="shop-image"
            style={{ 
              filter: inRoom ? 'brightness(0.9) drop-shadow(0 20px 40px rgba(0,0,0,0.3))' : 'none',
              transform: inRoom ? 'scale(0.85)' : 'scale(1)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
          />
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
