import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth({ onClose, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setUser(data.user);
        onClose();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        setUser(data.user);
        onClose();
      }
    } catch (err) {
      // In our mock environment without real keys, this will hit, so we provide a fallback for demo purposes.
      if (err.message.includes('placeholder')) {
         console.warn('Using mock login because Supabase keys are placeholders.');
         setUser({ email });
         onClose();
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <motion.div 
        className="auth-modal"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={onClose}><X size={24} color="var(--text-primary)" /></button>
        </div>
        
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email address" 
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {loading && <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'underline' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
