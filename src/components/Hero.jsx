import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

class Comet {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.delay = 0; // delay cooldown to stagger falls in time
  }

  reset(init = false, otherComets = []) {
    // 25 to 35 degrees relative to horizontal (diagonal slanted path)
    this.angle = (25 + Math.random() * 10) * Math.PI / 180; 
    this.speed = 4.0 + Math.random() * 5.0; // shooting star speed
    
    this.vx = -this.speed * Math.cos(this.angle); // moving left
    this.vy = this.speed * Math.sin(this.angle);  // moving down
    
    this.size = 1.0 + Math.random() * 1.0; 
    this.history = [];
    this.maxHistory = 50 + Math.floor(Math.random() * 30); // long trail (50 to 80 steps)
    this.opacity = 0.4 + Math.random() * 0.4; 

    // Find a spawn position that doesn't overlap path with other active comets
    let attempts = 0;
    let validX = false;
    let spawnX = 0;
    let spawnY = 0;

    while (!validX && attempts < 15) {
      if (init) {
        // Initial distribution across viewport height
        spawnY = Math.random() * this.height;
        spawnX = Math.random() * (this.width + 300);
      } else {
        // Spawn entering from top or right edges
        if (Math.random() > 0.5) {
          spawnY = -50;
          spawnX = Math.random() * (this.width + 400);
        } else {
          spawnX = this.width + 50;
          spawnY = Math.random() * (this.height * 0.8);
        }
      }

      // Check diagonal path distance against other active comets
      validX = true;
      const cot = 1 / Math.tan(this.angle);
      const thisLineConstant = spawnX + spawnY * cot;

      for (const other of otherComets) {
        if (other && other !== this && other.delay === 0) {
          const otherLineConstant = other.x + other.y * cot;
          // Keep active paths separated by at least 350px horizontally
          if (Math.abs(thisLineConstant - otherLineConstant) < 350) {
            validX = false;
            break;
          }
        }
      }
      attempts++;
    }

    this.x = spawnX;
    this.y = spawnY;

    if (init) {
      // Stagger initial delay (0 to 5 seconds)
      this.delay = Math.floor(Math.random() * 300);
    } else {
      // Cooldown delay before next shooting star (3 to 8 seconds)
      this.delay = 180 + Math.floor(Math.random() * 300);
    }
  }

  update(otherComets = []) {
    // If comet is on delay cooldown, decrement and wait
    if (this.delay > 0) {
      this.delay--;
      return;
    }

    // Save history for the trailing tail
    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Move comet
    this.x += this.vx;
    this.y += this.vy;

    // Reset if both head and tail end are off screen
    const isHeadOff = this.y > this.height + 50 || this.x < -100;
    const isTailOff = this.history.length === 0 || 
                      (this.history[this.history.length - 1].y > this.height + 50 || 
                       this.history[this.history.length - 1].x < -100);

    if (isHeadOff && isTailOff) {
      this.reset(false, otherComets);
    }
  }

  draw(ctx) {
    // Hide comet if it is in delay cooldown
    if (this.delay > 0 || this.history.length < 2) return;

    // Draw straight diagonal trail
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }

    const headX = this.history[0].x;
    const headY = this.history[0].y;
    const tailX = this.history[this.history.length - 1].x;
    const tailY = this.history[this.history.length - 1].y;

    const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
    grad.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
    grad.addColorStop(0.4, `rgba(255, 255, 255, ${this.opacity * 0.7})`);
    grad.addColorStop(0.8, `rgba(237, 181, 160, ${this.opacity * 0.25})`); // apricot-peach hue
    grad.addColorStop(1, 'rgba(237, 181, 160, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = this.size * 0.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw glowing head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export default function Hero() {
  const fullText = "Daria Illustrator";
  const [displayText, setDisplayText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const canvasRef = useRef(null);
  
  const { scrollY } = useScroll();
  const canvasOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    let introPlayed = false;
    try {
      introPlayed = sessionStorage.getItem('daria_intro_played');
    } catch (e) {
      console.warn('sessionStorage is not accessible:', e);
    }
    
    if (introPlayed) {
      setDisplayText(fullText);
      setIsTypingDone(true);
      return;
    }

    let currentText = "";
    let i = 0;
    let interval;
    
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        if (i < fullText.length) {
          currentText += fullText[i];
          setDisplayText(currentText);
          i++;
        } else {
          clearInterval(interval);
          setIsTypingDone(true);
          try {
            sessionStorage.setItem('daria_intro_played', 'true');
          } catch (e) {
            console.warn('sessionStorage write failed:', e);
          }
        }
      }, 60);
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Canvas particle logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let comets = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const count = Math.max(2, Math.min(5, Math.floor(window.innerWidth / 300)));
      comets = Array.from({ length: count }, () => new Comet(canvas.width, canvas.height));
      // Stagger them initially
      comets.forEach((c) => c.reset(true, comets));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      comets.forEach((comet) => {
        comet.update(comets);
        comet.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-bg" />
      
      <motion.canvas 
        ref={canvasRef}
        className="comets-canvas"
        style={{
          position: 'absolute',
          top: 0,
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          left: 0,
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: canvasOpacity
        }}
      />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <motion.h1 
          className="hero-headline"
          initial={{ opacity: 1 }}
        >
          {displayText}
          {!isTypingDone && <span className="typing-cursor" />}
        </motion.h1>
        
        <motion.p 
          className="hero-subheadline"
          initial={{ opacity: 0, y: 10 }}
          animate={isTypingDone ? { opacity: 0.6, y: 0 } : {}}
          transition={{ duration: 2.2, delay: 0.8 }}
        >
          Visual Storyteller & Printmaker
        </motion.p>
      </div>

      <motion.div 
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={isTypingDone ? { opacity: 0.4 } : {}}
        transition={{ duration: 1 }}
      >
        <div className="scroll-circle" />
      </motion.div>
    </section>
  );
}
