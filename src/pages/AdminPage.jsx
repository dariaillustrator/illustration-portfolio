import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Trash2, Lock, CheckCircle, AlertCircle, 
  Loader2, Sparkles, LogOut, X, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper to convert RGB to HSL in range [0, 1]
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h, s, l };
}

// Extract dominant HSL and Aspect Ratio from Image
async function analyzeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspect_ratio = width / height;

        // Create 50x50 canvas to get average color
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, 50, 50);
        const imgData = ctx.getImageData(0, 0, 50, 50).data;

        let rSum = 0, gSum = 0, bSum = 0;
        let pixelCount = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          rSum += imgData[i];
          gSum += imgData[i+1];
          bSum += imgData[i+2];
          pixelCount++;
        }

        const rAvg = rSum / pixelCount;
        const gAvg = gSum / pixelCount;
        const bAvg = bSum / pixelCount;

        const { h, s, l } = rgbToHsl(rAvg, gAvg, bAvg);
        resolve({ aspect_ratio, hue: h, saturation: s, lightness: l });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Compress and Resize Image Client-side
async function optimizeImage(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context is null"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error("Failed to load image for optimization"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file for optimization"));
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState(null);

  // Gallery items states
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const fileInputRef = useRef(null);

  // Check auth session
  useEffect(() => {
    const isAuthed = sessionStorage.getItem('admin_authenticated');
    if (isAuthed === 'true') {
      setIsAuthenticated(true);
      loadGalleryItems();
    }
  }, []);

  const loadGalleryItems = async () => {
    setIsLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGalleryItems(data || []);
    } catch (err) {
      console.error("Error loading gallery items:", err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleKeyPress = (num) => {
    setErrorMsg('');
    if (passcode.length < 4) {
      const nextPasscode = passcode + num;
      setPasscode(nextPasscode);
      if (nextPasscode === '7263') {
        setTimeout(() => {
          setIsAuthenticated(true);
          sessionStorage.setItem('admin_authenticated', 'true');
          loadGalleryItems();
        }, 300);
      } else if (nextPasscode.length === 4) {
        // Wrong passcode trigger shake
        setTimeout(() => {
          setIsShaking(true);
          setErrorMsg('Codice non corretto. Riprova.');
          setPasscode('');
          setTimeout(() => setIsShaking(false), 500);
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPasscode('');
    setSelectedFile(null);
    setPreviewUrl('');
    setAnalysisMeta(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadSuccess(false);
    
    // Auto populate title
    const filenameNoExt = file.name.split('.')[0].replace(/Untitled_Artwork/g, 'Artwork').replace(/_/g, ' ');
    setCustomTitle(filenameNoExt);

    try {
      setUploadStep('Analisi dei colori in corso...');
      const meta = await analyzeImage(file);
      setAnalysisMeta(meta);
      setUploadStep('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Impossibile analizzare l'immagine.");
      setUploadStep('');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadSuccess(false);
      const filenameNoExt = file.name.split('.')[0].replace(/Untitled_Artwork/g, 'Artwork').replace(/_/g, ' ');
      setCustomTitle(filenameNoExt);
      
      try {
        setUploadStep('Analisi dei colori in corso...');
        const meta = await analyzeImage(file);
        setAnalysisMeta(meta);
        setUploadStep('');
      } catch (err) {
        console.error(err);
        setErrorMsg("Impossibile analizzare l'immagine.");
        setUploadStep('');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !analysisMeta) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      // 1. Optimize Image
      setUploadStep('Ottimizzazione per il web (ridimensionamento e compressione)...');
      const optimizedBlob = await optimizeImage(selectedFile, 1600, 0.85);

      // 2. Convert Blob to Base64
      setUploadStep('Preparazione del file per il caricamento...');
      const reader = new FileReader();
      
      const fileExt = 'jpg'; // We compress to JPEG
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(',')[1];
          setUploadStep('Salvataggio sicuro su Cloudflare R2 e Supabase...');

          const response = await fetch('/api/upload-to-r2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image: base64data,
              filename: fileName,
              title: customTitle || 'Senza Titolo',
              aspect_ratio: analysisMeta.aspect_ratio,
              hue: analysisMeta.hue,
              saturation: analysisMeta.saturation,
              lightness: analysisMeta.lightness
            })
          });

          const resData = await response.json();
          if (!response.ok) {
            throw new Error(resData.error || 'Errore durante l\'upload.');
          }

          setUploadSuccess(true);
          setSelectedFile(null);
          setPreviewUrl('');
          setAnalysisMeta(null);
          setCustomTitle('');
          setIsUploading(false);
          setUploadStep('');
          loadGalleryItems();
        } catch (uploadErr) {
          console.error(uploadErr);
          setErrorMsg(`Errore nel caricamento: ${uploadErr.message}`);
          setIsUploading(false);
          setUploadStep('');
        }
      };

      reader.onerror = () => {
        throw new Error('Impossibile convertire l\'immagine.');
      };

      reader.readAsDataURL(optimizedBlob);

    } catch (err) {
      console.error(err);
      setErrorMsg(`Errore nel caricamento: ${err.message}`);
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = async (id, src) => {
    if (!window.confirm("Sei sicura di voler eliminare questa illustrazione? Verrà rimossa immediatamente anche dal sito pubblico.")) return;

    try {
      const response = await fetch('/api/delete-from-r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, src })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Impossibile eliminare l\'elemento.');
      }

      loadGalleryItems();
    } catch (err) {
      console.error(err);
      alert(`Impossibile eliminare l'elemento: ${err.message}`);
    }
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <div className="admin-page-container">
      <style>{`
        .admin-page-container {
          min-height: 100vh;
          background: #080810;
          color: #f3f4f6;
          font-family: 'Inter', sans-serif;
          padding-top: 8rem;
          padding-bottom: 6rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .admin-page-container::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%);
          top: -200px;
          left: -200px;
          z-index: 0;
          pointer-events: none;
        }

        .admin-page-container::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%);
          bottom: -200px;
          right: -200px;
          z-index: 0;
          pointer-events: none;
        }

        .glass-panel {
          background: rgba(15, 15, 25, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          z-index: 10;
          position: relative;
        }

        /* Lock Screen Keypad */
        .lock-container {
          width: 100%;
          max-width: 400px;
          padding: 3rem 2rem;
          text-align: center;
        }

        .lock-header {
          margin-bottom: 2.5rem;
        }

        .lock-icon-wrapper {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a855f7;
        }

        .lock-dots {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .lock-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .lock-dot.active {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-color: transparent;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
          transform: scale(1.2);
        }

        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.2rem;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }

        .keypad-btn {
          height: 68px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #f3f4f6;
          font-size: 1.6rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .keypad-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .keypad-btn:active {
          transform: scale(0.95);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
        }

        .keypad-btn.action-btn {
          font-size: 0.95rem;
          color: #9ca3af;
          border: none;
          background: transparent;
        }

        .keypad-btn.action-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #f3f4f6;
        }

        .shake-anim {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }

        /* Dashboard Screen */
        .dashboard-container {
          width: 100%;
          max-width: 1100px;
          padding: 3rem;
          margin-left: 2rem;
          margin-right: 2rem;
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 2rem;
          margin-bottom: 3rem;
        }

        .dash-title {
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 30%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-2px);
        }

        .upload-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
          margin-bottom: 4rem;
        }

        @media (max-width: 768px) {
          .upload-section {
            grid-template-columns: 1fr;
          }
        }

        /* Drag & Drop zone */
        .dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 3.5rem 2rem;
          text-align: center;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.01);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
        }

        .dropzone:hover, .dropzone.active {
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.03);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
        }

        .dropzone-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        .dropzone:hover .dropzone-icon-wrapper {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #fff;
          transform: scale(1.05);
        }

        .dropzone-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
          color: #e5e7eb;
        }

        .dropzone-text p {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        /* Preview card */
        .preview-card {
          padding: 1.8rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preview-image-container {
          width: 100%;
          height: 220px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #9ca3af;
        }

        .input-text {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.8rem 1rem;
          color: #f3f4f6;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-text:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
        }

        .meta-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }

        .meta-tag {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .meta-tag.color-tag {
          font-weight: 600;
          color: #e5e7eb;
        }

        .color-preview-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-button {
          width: 100%;
          padding: 0.9rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #ffffff;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(168, 85, 247, 0.2);
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px rgba(168, 85, 247, 0.3);
        }

        .action-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .action-button:disabled {
          background: rgba(255, 255, 255, 0.08);
          color: #6b7280;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Success Banner */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
        }

        .status-banner.success {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-banner.error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        /* List/Grid of Existing Items */
        .list-section {
          margin-top: 4rem;
        }

        .section-header {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.8rem;
          color: #e5e7eb;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .admin-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .admin-item-card {
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          group: hover;
          transition: all 0.3s ease;
        }

        .admin-item-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-4px);
        }

        .admin-item-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #05050a;
          position: relative;
        }

        .admin-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .admin-item-card:hover .admin-item-img {
          transform: scale(1.05);
        }

        .admin-item-details {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .admin-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-item-meta {
          font-size: 0.75rem;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .delete-overlay-btn {
          position: absolute;
          top: 0.8rem;
          right: 0.8rem;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          z-index: 5;
        }

        .admin-item-card:hover .delete-overlay-btn {
          opacity: 1;
          transform: scale(1);
        }

        .delete-overlay-btn:hover {
          background: #ef4444;
          transform: scale(1.1);
        }
      `}</style>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div 
            key="lock"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springConfig}
            className={`glass-panel lock-container ${isShaking ? 'shake-anim' : ''}`}
          >
            <div className="lock-header">
              <div className="lock-icon-wrapper">
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Accesso Riservato</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Inserisci il codice numerico per accedere</p>
            </div>

            <div className="lock-dots">
              {[0, 1, 2, 3].map((idx) => (
                <div 
                  key={idx} 
                  className={`lock-dot ${passcode.length > idx ? 'active' : ''}`}
                />
              ))}
            </div>

            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button 
                  key={num} 
                  onClick={() => handleKeyPress(num)}
                  className="keypad-btn"
                >
                  {num}
                </button>
              ))}
              <button className="keypad-btn action-btn" onClick={() => setPasscode('')}>C</button>
              <button onClick={() => handleKeyPress('0')} className="keypad-btn">0</button>
              <button className="keypad-btn action-btn" onClick={handleBackspace}>
                <ChevronRight style={{ transform: 'rotate(180deg)' }} size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={springConfig}
            className="glass-panel dashboard-container"
          >
            <div className="dash-header">
              <div>
                <h1 className="dash-title">
                  <Sparkles size={28} className="text-purple-500" />
                  Area Amministrativa Daria
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Carica e ottimizza nuove illustrazioni direttamente nel portfolio.
                </p>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={16} />
                Esci
              </button>
            </div>

            {errorMsg && (
              <div className="status-banner error" style={{ marginBottom: '2rem' }}>
                <AlertCircle size={20} />
                <span>{errorMsg}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="status-banner success" style={{ marginBottom: '2rem' }}>
                <CheckCircle size={20} />
                <span>Illustrazione caricata e ordinata per colore con successo! Appare ora sul frontend in tempo reale.</span>
              </div>
            )}

            <div className="upload-section">
              {/* Drag Drop Section */}
              <div className="flex flex-col gap-4">
                <div 
                  className="dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon-wrapper">
                    {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                  </div>
                  <div className="dropzone-text">
                    <h4>Trascina qui l'immagine</h4>
                    <p>oppure clicca per sfogliare i tuoi file</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                </div>

                {isUploading && (
                  <div className="flex flex-col gap-2 p-4 bg-black/20 border border-white/5 rounded-xl text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-indigo-400" />
                    <p style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 500 }}>{uploadStep}</p>
                  </div>
                )}
              </div>

              {/* Preview & Metadata Section */}
              <div className="glass-panel preview-card" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div className="preview-image-container">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="preview-img" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImageIcon size={48} strokeWidth={1} />
                      <p style={{ fontSize: '0.85rem' }}>Nessun file selezionato</p>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="title">Titolo dell'Opera</label>
                  <input 
                    type="text" 
                    id="title"
                    className="input-text"
                    placeholder="E.g. Beating Light"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    disabled={!selectedFile || isUploading}
                  />
                </div>

                {analysisMeta && (
                  <div className="flex flex-col gap-3">
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#9ca3af' }}>
                      Metadati di Ordinamento Rilevati:
                    </label>
                    <div className="meta-tags">
                      <div className="meta-tag color-tag">
                        Colore Principale:
                        <div 
                          className="color-preview-swatch" 
                          style={{ 
                            background: `hsl(${analysisMeta.hue * 360}, ${analysisMeta.saturation * 100}%, ${analysisMeta.lightness * 100}%)` 
                          }}
                        />
                      </div>
                      <div className="meta-tag">
                        Aspect Ratio: {analysisMeta.aspect_ratio.toFixed(3)}
                      </div>
                      <div className="meta-tag">
                        Ottimizzazione: JPG ~85% (Max 1600px)
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || !analysisMeta}
                  className="action-button"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Elaborazione in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Pubblica nel Portfolio
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List & Edit section */}
            <div className="list-section">
              <h3 className="section-header">
                <ImageIcon size={22} className="text-indigo-400" />
                Opere Attualmente Online ({galleryItems.length})
              </h3>

              {isLoadingItems ? (
                <div className="flex justify-center p-12">
                  <Loader2 size={36} className="animate-spin text-purple-500" />
                </div>
              ) : galleryItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">La galleria in Supabase è attualmente vuota o in fase di importazione.</p>
              ) : (
                <div className="admin-gallery-grid">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="admin-item-card">
                      <button 
                        onClick={() => handleDelete(item.id, item.src)}
                        className="delete-overlay-btn"
                        aria-label="Delete artwork"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="admin-item-image-wrapper">
                        <img src={item.src} alt={item.title} className="admin-item-img" />
                      </div>
                      <div className="admin-item-details">
                        <div className="admin-item-title">{item.title}</div>
                        <div className="admin-item-meta">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="color-preview-swatch"
                              style={{ 
                                width: '10px',
                                height: '10px',
                                background: `hsl(${item.hue * 360}, ${item.saturation * 100}%, ${item.lightness * 100}%)` 
                              }}
                            />
                            H:{(item.hue * 360).toFixed(0)}°
                          </div>
                          <span>Rapporto: {item.aspect_ratio.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
