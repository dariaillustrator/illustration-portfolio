import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="not-found-container">
      <style>{`
        .not-found-container {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: var(--font-main);
          color: var(--text-primary);
          padding: 2rem;
          margin-top: 4rem;
        }

        .flower-animation-wrapper {
          width: 250px;
          height: 250px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        /* Minimalist monochrome flower */
        .snowdrop-flower {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .flower-stem {
          stroke: var(--text-primary);
          stroke-width: 3;
          fill: none;
          stroke-linecap: round;
          opacity: 0.8;
          transition: stroke 0.5s ease;
        }

        .flower-leaf {
          fill: var(--text-primary);
          stroke: none;
          opacity: 0.5;
          transition: fill 0.5s ease;
        }

        /* Loop Anim for drooping stem/blossom */
        .flower-droop-group {
          animation: wiltAndRevive 6s ease-in-out infinite;
          transform-origin: 100px 90px;
        }

        .flower-blossom {
          fill: var(--text-primary);
          stroke: none;
          transition: fill 0.5s ease;
          animation: petalClose 6s ease-in-out infinite;
          transform-origin: 135px 120px;
        }

        .flower-cap {
          fill: var(--text-primary);
          stroke: none;
          opacity: 0.8;
          transition: fill 0.5s ease;
        }

        @keyframes wiltAndRevive {
          0%, 100% {
            transform: rotate(0deg) translateY(0px);
          }
          50% {
            transform: rotate(18deg) translateY(6px);
          }
        }

        @keyframes petalClose {
          0%, 100% {
            transform: scaleX(1) scaleY(1);
          }
          50% {
            transform: scaleX(0.8) scaleY(1.05);
          }
        }

        .not-found-title {
          font-family: var(--font-editorial);
          font-size: 5rem;
          line-height: 1.1;
          margin-bottom: 1rem;
          font-weight: normal;
        }

        .not-found-desc {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 460px;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .back-home-btn {
          padding: 0.8rem 2rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .back-home-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
      `}</style>

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

      <h1 className="not-found-title">Page Wilted</h1>
      <p className="not-found-desc">
        The page you are looking for has faded away, does not exist, or has been moved to another location.
      </p>
      
      <Link to="/" className="back-home-btn">
        Return to Portfolio
      </Link>
    </div>
  );
}
