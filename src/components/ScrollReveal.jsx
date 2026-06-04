import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollReveal({ children, style, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ type: "spring", bounce: 0.1, duration: 1 }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
