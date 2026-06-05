import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="not-found-container">
      <div className="flower-animation-wrapper">
        <svg viewBox="0 0 200 250" className="snowdrop-flower">
          {/* Main vertical stem base */}
          <path d="M 100 240 Q 98 160 100 90" className="flower-stem" />
          
          {/* Leaves growing from base */}
          <path d="M 100 240 Q 60 190 75 140 Q 85 180 100 240 Z" className="flower-leaf" />
          <path d="M 100 240 Q 130 200 115 155 Q 110 190 100 240 Z" className="flower-leaf" />

          {/* Group that bends and droops in loop */}
          <g className="flower-droop-group">
            {/* Curved top stem part hanging down */}
            <path d="M 100 90 Q 102 45 130 50 Q 140 55 135 90" className="flower-stem" />
            
            {/* Cap connection */}
            <path d="M 131 85 Q 135 80 139 85 Q 139 94 135 96 Q 131 94 131 85 Z" className="flower-cap" />

            {/* Petals that wilt (shrink & scale) */}
            <g className="flower-blossom">
              {/* Outer Left Petal */}
              <path d="M 135 93 Q 115 110 120 135 Q 133 130 135 93 Z" />
              {/* Outer Right Petal */}
              <path d="M 135 93 Q 155 110 150 135 Q 137 130 135 93 Z" />
              {/* Middle Petal */}
              <path d="M 135 93 Q 125 115 135 145 Q 145 115 135 93 Z" opacity="0.85" />
            </g>
          </g>
        </svg>
      </div>

      <h1 className="not-found-title">What are you looking for?</h1>
      <p className="not-found-desc">
        The page has faded away, does not exist, or has been moved to another location.
      </p>
      
      <Link to="/" className="back-home-btn">
        Return to Gallery
      </Link>
    </div>
  );
}
