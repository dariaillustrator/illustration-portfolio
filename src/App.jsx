import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import FaqOverlay from './components/FaqOverlay';
import ContactOverlay from './components/ContactOverlay';
import LegalOverlay from './components/LegalOverlay';
import CookieConsent from './components/CookieConsent';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import MobilePreview from './pages/MobilePreview';
import AdminPage from './pages/AdminPage';
import { UIProvider } from './context/UIContext';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <UIProvider>
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <SiteHeader />
          <FaqOverlay />
          <ContactOverlay />
          <LegalOverlay />
          <CookieConsent />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/preview" element={<MobilePreview />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </Router>
    </UIProvider>
  );
}

export default App;
