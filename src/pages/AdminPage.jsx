import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Trash2, Lock, CheckCircle, AlertCircle, 
  Loader2, Sparkles, LogOut, X, Image as ImageIcon, ChevronRight,
  ArrowLeft, ArrowRight, RefreshCw, Sliders
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

// Helper to convert HSL to HEX
function hslToHex(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1/3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1/3);
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
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
  const [isColorInverted, setIsColorInverted] = useState(false);
  const [copiedColor, setCopiedColor] = useState('');

  const fileInputRef = useRef(null);

  // Check auth session
  useEffect(() => {
    const isAuthed = sessionStorage.getItem('admin_authenticated');
    if (isAuthed === 'true') {
      setIsAuthenticated(true);
      loadGalleryItems();
    }
  }, []);

  const sortArtworks = (list, isInverted = false) => {
    return [...list].sort((a, b) => {
      const orderA = a.custom_order;
      const orderB = b.custom_order;
      
      if (orderA !== null && orderA !== undefined && orderB !== null && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== null && orderA !== undefined) return -1;
      if (orderB !== null && orderB !== undefined) return 1;

      const hA = a.hue ?? 0;
      const hB = b.hue ?? 0;
      const sA = a.saturation ?? 0;
      const sB = b.saturation ?? 0;
      const lA = a.lightness ?? 0;
      const lB = b.lightness ?? 0;
      
      if (hA !== hB) return isInverted ? hB - hA : hA - hB;
      if (sA !== sB) return isInverted ? sB - sA : sA - sB;
      return isInverted ? lB - lA : lA - lB;
    });
  };

  const loadGalleryItems = async () => {
    setIsLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*');

      if (error) throw error;

      // Extract settings row
      const settingsItem = data.find(item => item.title === '__site_settings__');
      const inverted = settingsItem ? settingsItem.hue === 1.0 : false;
      setIsColorInverted(inverted);

      // Filter out settings row
      const filtered = (data || []).filter(item => item.title !== '__site_settings__');
      setGalleryItems(sortArtworks(filtered, inverted));
    } catch (err) {
      console.error("Error loading gallery items:", err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const saveNewOrder = async (orderedItems) => {
    setIsLoadingItems(true);
    try {
      const promises = orderedItems.map((item, index) => {
        return supabase
          .from('gallery_items')
          .update({ custom_order: index + 1 })
          .eq('id', item.id);
      });
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error);
      if (error) throw error.error;
      
      await loadGalleryItems();
    } catch (err) {
      console.error("Failed to save custom order:", err.message);
      setErrorMsg(`Failed to save custom order: ${err.message}`);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleMove = async (index, direction) => {
    const newItems = [...galleryItems];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    
    setGalleryItems(newItems);
    await saveNewOrder(newItems);
  };

  const handleResetOrder = async () => {
    if (!window.confirm("Are you sure you want to reset all manual positions and restore automatic color sorting?")) return;
    setIsLoadingItems(true);
    try {
      // Reset custom_order for all items
      const { error: resetError } = await supabase
        .from('gallery_items')
        .update({ custom_order: null })
        .neq('title', '__site_settings__');
      
      if (resetError) throw resetError;

      // Also reset inversion settings back to false
      const { error: settingsError } = await supabase
        .from('gallery_items')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000',
          src: 'settings',
          title: '__site_settings__',
          aspect_ratio: 0,
          hue: 0.0,
          saturation: 0,
          lightness: 0
        });
      
      if (settingsError) throw settingsError;

      await loadGalleryItems();
    } catch (err) {
      console.error("Failed to reset order:", err.message);
      setErrorMsg(`Failed to reset order: ${err.message}`);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleInvertChromaticOrder = async () => {
    setIsLoadingItems(true);
    try {
      const nextInvertedValue = isColorInverted ? 0.0 : 1.0;
      
      const { error } = await supabase
        .from('gallery_items')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000',
          src: 'settings',
          title: '__site_settings__',
          aspect_ratio: 0,
          hue: nextInvertedValue,
          saturation: 0,
          lightness: 0
        });

      if (error) throw error;
      await loadGalleryItems();
    } catch (err) {
      console.error("Failed to invert order:", err.message);
      setErrorMsg(`Failed to invert order: ${err.message}`);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCopyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(''), 1500);
  };

  const getSignaturePalette = (items) => {
    if (!items || items.length === 0) return [];
    
    const groups = {};
    items.forEach(item => {
      const hBin = Math.round((item.hue || 0) * 12) % 12;
      const sBin = Math.round((item.saturation || 0) * 3);
      const lBin = Math.round((item.lightness || 0) * 3);
      const key = `${hBin}-${sBin}-${lBin}`;
      
      if (!groups[key]) {
        groups[key] = {
          hSum: 0,
          sSum: 0,
          lSum: 0,
          count: 0
        };
      }
      
      groups[key].hSum += item.hue || 0;
      groups[key].sSum += item.saturation || 0;
      groups[key].lSum += item.lightness || 0;
      groups[key].count += 1;
    });
    
    return Object.values(groups)
      .map(g => {
        const h = g.hSum / g.count;
        const s = g.sSum / g.count;
        const l = g.lSum / g.count;
        return {
          h, s, l,
          hex: hslToHex(h, s, l),
          count: g.count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
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
          setErrorMsg('Incorrect passcode. Please try again.');
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
      setUploadStep('Analyzing color metrics...');
      const meta = await analyzeImage(file);
      setAnalysisMeta(meta);
      setUploadStep('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to analyze image color profile.");
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
        setUploadStep('Analyzing color metrics...');
        const meta = await analyzeImage(file);
        setAnalysisMeta(meta);
        setUploadStep('');
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to analyze image color profile.");
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
      setUploadStep('Optimizing for web (resizing and compression)...');
      const optimizedBlob = await optimizeImage(selectedFile, 1600, 0.85);

      // 2. Convert Blob to Base64
      setUploadStep('Preparing file for upload...');
      const reader = new FileReader();
      
      const fileExt = 'jpg'; // We compress to JPEG
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(',')[1];
          setUploadStep('Uploading safely to Cloudflare R2 and Supabase...');

          const response = await fetch('/api/upload-to-r2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image: base64data,
              filename: fileName,
              title: customTitle || 'Untitled',
              aspect_ratio: analysisMeta.aspect_ratio,
              hue: analysisMeta.hue,
              saturation: analysisMeta.saturation,
              lightness: analysisMeta.lightness
            })
          });

          const resData = await response.json();
          if (!response.ok) {
            throw new Error(resData.error || 'Upload failed.');
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
          setErrorMsg(`Upload failed: ${uploadErr.message}`);
          setIsUploading(false);
          setUploadStep('');
        }
      };

      reader.onerror = () => {
        throw new Error('Could not convert image.');
      };

      reader.readAsDataURL(optimizedBlob);

    } catch (err) {
      console.error(err);
      setErrorMsg(`Upload failed: ${err.message}`);
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = async (id, src) => {
    if (!window.confirm("Are you sure you want to delete this artwork? It will be removed immediately from the public website.")) return;

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
        throw new Error(resData.error || 'Failed to delete item.');
      }

      loadGalleryItems();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <div className="admin-page-container">
      <style>{`
        .admin-page-container {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-main);
          padding-top: 8rem;
          padding-bottom: 6rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
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
          background: rgba(var(--bg-primary-rgb), 0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid var(--border);
          color: var(--text-primary);
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
          border: 2px solid var(--border);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .lock-dot.active {
          background: var(--text-primary);
          border-color: transparent;
          box-shadow: 0 0 10px rgba(var(--text-primary), 0.3);
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
          background: rgba(var(--bg-primary-rgb), 0.03);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 1.6rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .keypad-btn:hover {
          background: rgba(var(--bg-primary-rgb), 0.08);
          border-color: var(--text-primary);
          transform: scale(1.05);
        }

        .keypad-btn:active {
          transform: scale(0.95);
          background: rgba(var(--bg-primary-rgb), 0.15);
        }

        .keypad-btn.action-btn {
          font-size: 0.95rem;
          color: var(--text-secondary);
          border: none;
          background: transparent;
        }

        .keypad-btn.action-btn:hover {
          background: rgba(var(--bg-primary-rgb), 0.03);
          color: var(--text-primary);
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
          margin-left: auto;
          margin-right: auto;
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2rem;
          margin-bottom: 3rem;
        }

        .dash-title {
          font-size: 2.2rem;
          font-family: var(--font-editorial);
          font-weight: normal;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
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
          .dashboard-container {
            padding: 1.5rem;
          }
        }

        /* Drag & Drop zone */
        .dropzone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 3.5rem 2rem;
          text-align: center;
          cursor: pointer;
          background: rgba(var(--bg-primary-rgb), 0.01);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
        }

        .dropzone:hover, .dropzone.active {
          border-color: var(--text-primary);
          background: rgba(var(--bg-primary-rgb), 0.03);
        }

        .dropzone-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: rgba(var(--bg-primary-rgb), 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }

        .dropzone:hover .dropzone-icon-wrapper {
          background: var(--text-primary);
          color: var(--bg-primary);
          transform: scale(1.05);
        }

        .dropzone-text h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
          color: var(--text-primary);
        }

        .dropzone-text p {
          font-size: 0.85rem;
          color: var(--text-secondary);
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
          border-radius: var(--radius-md);
          overflow: hidden;
          background: rgba(var(--bg-primary-rgb), 0.05);
          border: 1px solid var(--border);
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
          color: var(--text-secondary);
        }

        .input-text {
          background: rgba(var(--bg-primary-rgb), 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.8rem 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .input-text:focus {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 2px rgba(var(--text-primary), 0.1);
        }

        .meta-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }

        .meta-tag {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-md);
          background: rgba(var(--bg-primary-rgb), 0.03);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .meta-tag.color-tag {
          font-weight: 600;
          color: var(--text-primary);
        }

        .color-preview-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(var(--text-primary), 0.2);
        }

        .action-button {
          width: 100%;
          padding: 0.9rem;
          border-radius: var(--radius-md);
          background: var(--text-primary);
          color: var(--bg-primary);
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.3s ease;
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .action-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .action-button:disabled {
          background: rgba(var(--bg-primary-rgb), 0.08);
          color: var(--text-secondary);
          cursor: not-allowed;
        }

        /* Success Banner */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }

        .status-banner.success {
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-banner.error {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        /* List/Grid of Existing Items */
        .list-section {
          margin-top: 4rem;
        }

        .section-header {
          font-size: 1.5rem;
          font-family: var(--font-editorial);
          font-weight: normal;
          color: var(--text-primary);
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
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          position: relative;
          transition: all 0.3s ease;
        }

        .admin-item-card:hover {
          border-color: var(--text-primary);
          transform: translateY(-4px);
        }

        .admin-item-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: rgba(var(--bg-primary-rgb), 0.05);
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
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-item-meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
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
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
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

        .order-actions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
        }

        .admin-item-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.8rem;
          padding-top: 0.8rem;
          border-top: 1px solid var(--border);
          gap: 0.4rem;
        }

        .move-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          padding: 0.35rem 0.55rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: rgba(var(--text-primary-rgb), 0.03);
          color: var(--text-primary);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .move-btn:hover:not(:disabled) {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .move-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .order-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(var(--text-primary-rgb), 0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
        }

        .btn-action-order {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          font-family: var(--font-main);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          background: rgba(var(--text-primary-rgb), 0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-action-order:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .btn-action-order:active {
          transform: translateY(0);
        }

        .btn-action-order.active-toggle {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Color Palette Section styles */
        .palette-section {
          margin-bottom: 3.5rem;
          padding: 2.5rem 0 1rem 0;
          border-top: 1px solid var(--border);
        }

        .palette-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.2rem;
          margin-top: 1.5rem;
        }

        .palette-swatch-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          padding: 1rem 0.8rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-width: 90px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }

        .palette-swatch-card:hover {
          transform: translateY(-3px);
          border-color: var(--text-primary);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }

        .palette-swatch-color {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border);
        }

        .palette-swatch-hex {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .palette-swatch-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--text-primary);
          color: var(--bg-primary);
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Admin Access Only</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Enter the passcode to unlock the dashboard</p>
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
                  Daria's Creative Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  Upload and optimize new illustrations directly into the portfolio.
                </p>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={16} />
                Sign Out
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
                <span>Artwork uploaded and color-sorted successfully! It is now live in real-time.</span>
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
                    <h4>Drag & drop your artwork here</h4>
                    <p>or click to browse local files</p>
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
                      <p style={{ fontSize: '0.85rem' }}>No file selected</p>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="title">Artwork Title</label>
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
                      Detected Sorting Metadata:
                    </label>
                    <div className="meta-tags">
                      <div className="meta-tag color-tag">
                        Dominant Color:
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
                        Optimization: JPG ~85% (Max 1600px)
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Publish to Portfolio
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Color Palette Section */}
            <div className="palette-section">
              <h3 className="section-header" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} />
                Illustrations Color Palette
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Daria's most used color tones across all portfolio items. Click any color swatch to copy its HEX code for your design tools.
              </p>
              <div className="palette-grid">
                {getSignaturePalette(galleryItems).map((swatch, idx) => (
                  <div 
                    key={idx} 
                    className="palette-swatch-card"
                    onClick={() => handleCopyColor(swatch.hex)}
                  >
                    <div 
                      className="palette-swatch-color"
                      style={{ background: swatch.hex }}
                    />
                    <span className="palette-swatch-hex">{swatch.hex}</span>
                    <span className="palette-swatch-count">{swatch.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List & Edit section */}
            <div className="list-section">
              <div className="flex flex-col gap-4 mb-8">
                <h3 className="section-header" style={{ marginBottom: 0 }}>
                  <ImageIcon size={22} />
                  Active Portfolio Artworks ({galleryItems.length})
                </h3>
                <div className="order-actions-row">
                  <button 
                    onClick={handleResetOrder} 
                    className="btn-action-order"
                  >
                    <RefreshCw size={14} />
                    Reset to Color Order
                  </button>
                  <button 
                    onClick={handleInvertChromaticOrder} 
                    className={`btn-action-order ${isColorInverted ? 'active-toggle' : ''}`}
                  >
                    <Sliders style={{ transform: isColorInverted ? 'rotate(0deg)' : 'rotate(180deg)' }} size={14} />
                    {isColorInverted ? 'Inverted Color Sorting' : 'Invert Color Sorting'}
                  </button>
                </div>
              </div>

              {isLoadingItems ? (
                <div className="flex justify-center p-12">
                  <Loader2 size={36} className="animate-spin text-purple-500" />
                </div>
              ) : galleryItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">The database gallery is empty or loading.</p>
              ) : (
                <div className="admin-gallery-grid">
                  {galleryItems.map((item, index) => (
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
                          <span>Ratio: {item.aspect_ratio.toFixed(2)}</span>
                        </div>
                        
                        <div className="admin-item-controls">
                          <button 
                            disabled={index === 0} 
                            onClick={() => handleMove(index, 'left')}
                            className="move-btn"
                            title="Move Backward"
                          >
                            <ArrowLeft size={14} />
                            <span>Prev</span>
                          </button>
                          <span className="order-badge">#{index + 1}</span>
                          <button 
                            disabled={index === galleryItems.length - 1} 
                            onClick={() => handleMove(index, 'right')}
                            className="move-btn"
                            title="Move Forward"
                          >
                            <span>Next</span>
                            <ArrowRight size={14} />
                          </button>
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

      <AnimatePresence>
        {copiedColor && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              padding: '0.8rem 1.5rem',
              borderRadius: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 9999,
              fontFamily: 'var(--font-main)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            <CheckCircle size={16} />
            <span>Copied {copiedColor} to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
