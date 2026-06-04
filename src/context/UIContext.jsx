import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [legalType, setLegalType] = useState(null); // 'terms' | 'privacy' | null

  const toggleFaq = () => setIsFaqOpen(prev => !prev);
  const closeFaq = () => setIsFaqOpen(false);

  const openContact = () => setIsContactOpen(true);
  const closeContact = () => setIsContactOpen(false);

  const openLegal = (type) => setLegalType(type);
  const closeLegal = () => setLegalType(null);

  return (
    <UIContext.Provider value={{ 
      isFaqOpen, toggleFaq, closeFaq,
      isContactOpen, openContact, closeContact,
      legalType, openLegal, closeLegal
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
