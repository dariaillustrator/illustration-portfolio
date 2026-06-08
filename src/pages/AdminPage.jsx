import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Trash2, Lock, CheckCircle, AlertCircle, 
  Loader2, Sparkles, LogOut, X, Image as ImageIcon, ChevronRight,
  RefreshCw, ChevronLeft, Save, Download, Archive, Info,
  Share2, Eye, Check, Square, CheckSquare, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';

// Simple cross-device file save helper (replaces file-saver)
function saveAs(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Cleanup after a short delay to allow download to start
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

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

function isNew(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours < 2;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Responsive mobile block state
  const [isPhone, setIsPhone] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState(null);

  // Gallery items states
  const [activeItems, setActiveItems] = useState([]);
  const [parkedItems, setParkedItems] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [storageUsedGB, setStorageUsedGB] = useState(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [sortingMode, setSortingMode] = useState('chromatic_asc'); // 'chromatic_asc', 'chromatic_desc', 'manual'
  const [isDirty, setIsDirty] = useState(false);
  const [copiedColor, setCopiedColor] = useState('');
  
  // Rename states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSharingBulk, setIsSharingBulk] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const shareDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Feature request states
  const [requestContent, setRequestContent] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requests, setRequests] = useState([]);

  const fileInputRef = useRef(null);

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Custom confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    setConfirmDialog({ message, onConfirm, onCancel });
  }, []);

  const handleConfirmYes = useCallback(() => {
    if (confirmDialog?.onConfirm) confirmDialog.onConfirm();
    setConfirmDialog(null);
  }, [confirmDialog]);

  const handleConfirmNo = useCallback(() => {
    if (confirmDialog?.onCancel) confirmDialog.onCancel();
    setConfirmDialog(null);
  }, [confirmDialog]);

  // Selection toggle helper functions
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAllActive = useCallback(() => {
    const allActiveIds = activeItems.map(item => item.id);
    const areAllSelected = allActiveIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        // Deselect all active
        allActiveIds.forEach(id => next.delete(id));
      } else {
        // Select all active
        allActiveIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [activeItems, selectedIds]);

  const selectAllParked = useCallback(() => {
    const allParkedIds = parkedItems.map(item => item.id);
    const areAllSelected = allParkedIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        // Deselect all parked
        allParkedIds.forEach(id => next.delete(id));
      } else {
        // Select all parked
        allParkedIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [parkedItems, selectedIds]);


  // Portfolio download states
  const [isDownloadingPortfolio, setIsDownloadingPortfolio] = useState(false);
  const [portfolioDownloadProgress, setPortfolioDownloadProgress] = useState('');

  // Responsive width listener
  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check auth session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_token');
    if (isAuth) {
      setIsAuthenticated(true);
      loadGalleryItems();
    }
    // Listen for Escape to drop file
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && isUploading) {
        setSelectedFile(null);
        setPreviewUrl('');
        setAnalysisMeta(null);
        setUploadStep('');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const sortArtworks = (list, mode) => {
    if (mode === 'manual') {
      return [...list].sort((a, b) => {
        const orderA = a.custom_order ?? 999999;
        const orderB = b.custom_order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.hue ?? 0) - (b.hue ?? 0);
      });
    } else {
      const isInverted = mode === 'chromatic_desc';
      return [...list].sort((a, b) => {
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
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const filtered = data.filter(req => {
          if (!req.completed) return true;
          if (!req.completed_at) return false;
          return new Date(req.completed_at) > sixHoursAgo;
        });
        setRequests(filtered);
      }
    } catch (err) {
      console.error("Error loading requests:", err.message);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/r2-stats', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStorageUsedGB(data.totalSizeGB);
      }
    } catch (e) {
      console.error(e);
    }
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
      let mode = 'chromatic_asc';
      if (settingsItem) {
        if (settingsItem.hue === 1.0) mode = 'chromatic_desc';
        else if (settingsItem.hue === 2.0) mode = 'manual';
      }
      setSortingMode(mode);

      // Extract trash row
      const trashItem = data.find(item => item.title === '__site_trash__');
      let currentTrash = [];
      let trashNeedsCleanup = false;

      if (trashItem && trashItem.src) {
        try {
          currentTrash = JSON.parse(trashItem.src);
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const validTrash = [];

          for (const item of currentTrash) {
            const deletedAtTime = new Date(item.deleted_at).getTime();
            if (deletedAtTime < thirtyDaysAgo) {
              // Permanently delete from R2
              try {
                await fetch('/api/delete-from-r2', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
                  },
                  body: JSON.stringify({ id: item.id, src: item.src, skipDbDelete: true })
                });
                trashNeedsCleanup = true;
              } catch (delErr) {
                console.error("Failed to cleanup old trash item:", delErr);
                validTrash.push(item); // keep it if delete failed
              }
            } else {
              validTrash.push(item);
            }
          }

          if (trashNeedsCleanup) {
            currentTrash = validTrash;
            await fetch('/api/admin-action', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
              },
              body: JSON.stringify({
                action: 'update_trash_list',
                payload: { trashList: currentTrash }
              })
            });
          }
        } catch (e) {
          console.error("Failed to parse trash items", e);
        }
      }
      setTrashItems(currentTrash);

      // Filter out special rows
      const filtered = (data || []).filter(item => !item.title.startsWith('__site_'));
      const active = filtered.filter(item => !item.is_parked);
      const parked = filtered.filter(item => item.is_parked);

      setActiveItems(sortArtworks(active, mode));
      setParkedItems(sortArtworks(parked, 'chromatic_asc'));
      setIsDirty(false);
      
      await loadRequests();
      await loadStats();
    } catch (err) {
      console.error("Error loading gallery items:", err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Move item left or right in the grid (manual reorder)
  const handleMove = (index, direction) => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;
    setActiveItems(prev => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
    setSortingMode('manual');
    setIsDirty(true);
  };

  // 2-button sort: "Color" (clicks toggle ↑↓) and "Manual"
  const handleModeSwitch = (btn) => {
    if (btn === 'color') {
      const nextMode = sortingMode === 'chromatic_asc' ? 'chromatic_desc'
        : sortingMode === 'chromatic_desc' ? 'chromatic_asc'
        : 'chromatic_asc';
      setSortingMode(nextMode);
      setActiveItems(prev => sortArtworks(prev, nextMode));
      setIsDirty(true);
    } else if (btn === 'manual') {
      if (sortingMode === 'manual') return;
      setSortingMode('manual');
      setActiveItems(prev => prev.map((item, i) => ({ ...item, custom_order: i + 1 })));
      setIsDirty(true);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoadingItems(true);
    try {
      let hueVal = 0.0;
      if (sortingMode === 'chromatic_desc') hueVal = 1.0;
      else if (sortingMode === 'manual') hueVal = 2.0;

      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'save_order',
          payload: {
            sortingModeVal: hueVal,
            activeItems,
            parkedItems
          }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to save changes.');
      }

      await loadGalleryItems();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save changes:", err.message);
      setErrorMsg(`Failed to save changes: ${err.message}`);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleUnparkItemLocal = (item) => {
    const newParked = parkedItems.filter(p => p.id !== item.id);
    let newActive;
    if (sortingMode === 'manual') {
      // In manual mode: place the unparked item at position 1 (first),
      // shifting all existing active items up by 1.
      const shifted = activeItems.map(a => ({
        ...a,
        custom_order: (a.custom_order ?? 999999) + 1
      }));
      const unparkWithOrder = { ...item, custom_order: 1 };
      newActive = sortArtworks([unparkWithOrder, ...shifted], 'manual');
    } else {
      // In chromatic mode: insert in correct color position
      newActive = sortArtworks([...activeItems, item], sortingMode);
    }
    setParkedItems(newParked);
    setActiveItems(newActive);
    setIsDirty(true);
  };

  const handleParkItemLocal = (index) => {
    const item = activeItems[index];
    const newActive = activeItems.filter((_, idx) => idx !== index);
    const newParked = [...parkedItems, item];
    setActiveItems(newActive);
    setParkedItems(sortArtworks(newParked, 'chromatic_asc'));
    setIsDirty(true);
  };

  const handleRenameStart = useCallback((id, title) => {
    setEditingId(id);
    setEditingName(title);
  }, []);

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    setIsSavingName(false);
  }, []);

  const handleRenameConfirm = useCallback(async (id, isParked) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      showToast('Title cannot be empty', 'error');
      return;
    }
    
    setIsSavingName(true);
    try {
      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'rename_item',
          payload: {
            itemId: id,
            newTitle: trimmedName
          }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to rename artwork.');
      }

      // Update state in place
      if (isParked) {
        setParkedItems(prev => prev.map(item => item.id === id ? { ...item, title: trimmedName } : item));
      } else {
        setActiveItems(prev => prev.map(item => item.id === id ? { ...item, title: trimmedName } : item));
      }

      showToast('Artwork renamed successfully', 'success');
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error("Failed to rename artwork:", err.message);
      showToast(`Failed to rename: ${err.message}`, 'error');
    } finally {
      setIsSavingName(false);
    }
  }, [editingName, showToast]);

  const handleCompleteRequest = async (id) => {
    try {
      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'complete_request',
          payload: { requestId: id }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to complete request.');
      }

      await loadRequests();
    } catch (err) {
      console.error("Failed to complete request:", err.message);
      setErrorMsg(`Failed to complete request: ${err.message}`);
    }
  };

  const handleDeleteRequest = async (id) => {
    showConfirm("Are you sure you want to delete this request?", async () => {
    try {
      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'delete_request',
          payload: { requestId: id }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to delete request.');
      }

      await loadRequests();
    } catch (err) {
      console.error("Failed to delete request:", err.message);
      showToast(`Failed to delete request: ${err.message}`, 'error', 5000);
    }
    });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestContent.trim()) return;

    setIsSubmittingRequest(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'submit_request',
          payload: { content: requestContent.trim() }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to submit request.');
      }

      setRequestContent('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await loadRequests();
    } catch (err) {
      console.error("Failed to submit feature request:", err.message);
      setErrorMsg(`Failed to submit request: ${err.message}`);
    } finally {
      setIsSubmittingRequest(false);
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
    if (passcode.length < 6) {
      const nextPasscode = passcode + num;
      setPasscode(nextPasscode);
      if (nextPasscode === '090516') {
        setTimeout(() => {
          setIsAuthenticated(true);
          sessionStorage.setItem('admin_token', nextPasscode);
          loadGalleryItems();
        }, 300);
      } else if (nextPasscode.length === 6) {
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

  useEffect(() => {
    if (isAuthenticated) return;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        setPasscode('');
        setErrorMsg('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthenticated, passcode, isShaking]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setPasscode('');
    setSelectedFile(null);
    setPreviewUrl('');
    setAnalysisMeta(null);
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setAnalysisMeta(null);
    setCustomTitle('');
    setUploadStep('');
    setIsUploading(false);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const handleUpload = async (shouldPark = false) => {
    if (!selectedFile || !analysisMeta) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      // 1. Optimize Image
      setUploadStep('Optimizing for web (resizing and compression)...');
      const optimizedBlob = await optimizeImage(selectedFile, 1600, 0.85);

      // 2. Convert to Base64
      setUploadStep('Preparing files for upload...');
      
      const isPng = selectedFile.type === 'image/png';
      const isTooLarge = selectedFile.size > 2.5 * 1024 * 1024;
      
      let originalBlob = selectedFile;
      let originalExt = selectedFile.name.split('.').pop() || 'jpg';
      
      if (isPng || isTooLarge) {
        setUploadStep('Optimizing original image to fit server limits...');
        originalBlob = await optimizeImage(selectedFile, 3600, 0.90);
        originalExt = 'jpg'; // We optimized/converted it to JPEG
      }
      
      const fileExt = 'jpg'; // We compress optimized to JPEG
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const originalFileName = `original_${fileName.split('.')[0]}.${originalExt}`;

      const readAsBase64 = (fileOrBlob) => {
        return new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result.split(',')[1]);
          r.onerror = reject;
          r.readAsDataURL(fileOrBlob);
        });
      };

      try {
        const base64data = await readAsBase64(optimizedBlob);
        const originalBase64 = await readAsBase64(originalBlob);

        setUploadStep('Uploading safely to Cloudflare R2 and Supabase...');

        const response = await fetch('/api/upload-to-r2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
          },
          body: JSON.stringify({
            image: base64data,
            original_image: originalBase64,
            filename: fileName,
            original_filename: originalFileName,
            title: customTitle || 'Untitled',
            aspect_ratio: analysisMeta.aspect_ratio,
            hue: analysisMeta.hue,
            saturation: analysisMeta.saturation,
            lightness: analysisMeta.lightness,
            is_parked: shouldPark
          })
        });

          const resData = await response.json();
          if (!response.ok) {
            throw new Error(resData.error || 'Upload failed.');
          }

          // Immediately inject the newly uploaded item into local state
          // so the gallery list updates without waiting for a full DB reload.
          if (resData.item) {
            const newItem = resData.item;
            if (shouldPark) {
              setParkedItems(prev => sortArtworks([...prev, newItem], 'chromatic_asc'));
            } else {
              if (sortingMode === 'manual') {
                // Place at position 1, shift everything else
                setActiveItems(prev => {
                  const shifted = prev.map(a => ({
                    ...a,
                    custom_order: (a.custom_order ?? 999999) + 1
                  }));
                  const newWithOrder = { ...newItem, custom_order: 1 };
                  return sortArtworks([newWithOrder, ...shifted], 'manual');
                });
              } else {
                setActiveItems(prev => sortArtworks([...prev, newItem], sortingMode));
              }
            }
          }

          setUploadSuccess(true);
          setSelectedFile(null);
          setPreviewUrl('');
          setAnalysisMeta(null);
          setCustomTitle('');
          setIsUploading(false);
          setUploadStep('');
          // Also do a full reload in the background to sync any server-side changes
          loadGalleryItems();
        } catch (uploadErr) {
          console.error(uploadErr);
          setErrorMsg(`Upload failed: ${uploadErr.message}`);
          setIsUploading(false);
          setUploadStep('');
        }

    } catch (err) {
      console.error(err);
      setErrorMsg(`Upload failed: ${err.message}`);
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = async (item) => {
    showConfirm(
      "Are you sure you want to move this artwork to the Trash? It will be removed from the public website but can be restored for 30 days.",
      async () => {
        try {
          const response = await fetch('/api/admin-action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
            },
            body: JSON.stringify({
              action: 'move_to_trash',
              payload: { itemId: item.id, trashItems: trashItems }
            })
          });

          if (!response.ok) {
            const resData = await response.json();
            throw new Error(resData.error || 'Failed to move to trash.');
          }

          showToast('Artwork moved to trash successfully', 'success');
          await loadGalleryItems();
        } catch (err) {
          console.error(err);
          showToast(`Failed to delete item: ${err.message}`, 'error', 6000);
        }
      }
    );
  };

  const handleRestore = async (item, shouldPark = false) => {
    try {
      const { deleted_at, ...originalItem } = item;
      const restoredItem = {
        ...originalItem,
        is_parked: shouldPark,
        custom_order: null
      };

      const response = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'restore_from_trash',
          payload: { item: restoredItem }
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Failed to restore.');
      }

      showToast(shouldPark ? 'Artwork restored to "Not Sure Yet"' : 'Artwork restored to gallery!', 'success');
      await loadGalleryItems();
    } catch (err) {
      console.error(err);
      showToast(`Failed to restore item: ${err.message}`, 'error', 6000);
    }
  };

  const handleDownloadOriginal = async (item) => {
    if (!item || !item.src) return;
    try {
      const urlObj = new URL(item.src);
      const urlParts = urlObj.pathname.split('/');
      const filename = urlParts.pop();
      const baseUrl = urlObj.origin + urlParts.join('/');
      
      let originalExt = 'jpg';
      if (urlObj.searchParams.has('oext')) {
        originalExt = urlObj.searchParams.get('oext');
      }

      const baseName = filename.split('.')[0];
      const originalFilename = `original_${baseName}.${originalExt}`;
      const originalUrl = `${baseUrl}/${originalFilename}`;

      const isDashboardUpload = /^\d+_[a-z0-9]+/.test(filename);

      let downloadUrl = item.src;
      let downloadName = item.title ? `${item.title}.${originalExt}` : filename;

      if (isDashboardUpload) {
        try {
          const res = await fetch(originalUrl, { method: 'HEAD' });
          if (res.ok) {
            downloadUrl = originalUrl;
            downloadName = item.title ? `${item.title}_original.${originalExt}` : originalFilename;
          }
        } catch (err) {
          console.warn("Could not verify original image existence, falling back to optimized", err);
        }
      }
      
      // Fetch blob and trigger real download (works cross-origin and on all devices)
      showToast('Starting download...', 'info', 2000);
      try {
        const response = await fetch(`${downloadUrl}?cache-bust=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        saveAs(blob, downloadName);
        showToast('Download complete!', 'success');
      } catch (fetchErr) {
        console.warn("Fetch failed, falling back to new window open (CORS likely not configured on R2)", fetchErr);
        window.open(downloadUrl, '_blank');
        showToast('Opening original image in a new tab...', 'success', 3000);
      }
    } catch (e) {
      console.error("Failed to trigger download", e);
      showToast('Could not download the image. Please try again.', 'error', 5000);
    }
  };

  const handleDownloadPortfolio = async () => {
    if (isDownloadingPortfolio) return;
    setIsDownloadingPortfolio(true);
    setPortfolioDownloadProgress('Fetching file list...');

    try {
      // 1. Get list of all files from R2
      const listRes = await fetch('/api/list-portfolio', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
      });

      if (!listRes.ok) throw new Error('Failed to fetch file list');
      const { files } = await listRes.json();

      if (!files || files.length === 0) {
        showToast('No files found in the portfolio.', 'error');
        setIsDownloadingPortfolio(false);
        return;
      }

      // 2. Create ZIP
      const zip = new JSZip();
      let downloaded = 0;

      for (const file of files) {
        try {
          setPortfolioDownloadProgress(`Downloading ${downloaded + 1}/${files.length}: ${file.key}`);
          const res = await fetch(`${file.url}?cache-bust=${Date.now()}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(file.key, blob);
          }
          downloaded++;
        } catch (err) {
          console.warn(`Skipping ${file.key}:`, err);
          downloaded++;
        }
      }

      // 3. Generate and download ZIP
      setPortfolioDownloadProgress('Compressing files...');
      const content = await zip.generateAsync({ type: 'blob' });
      const date = new Date().toISOString().split('T')[0];
      saveAs(content, `daria-portfolio-${date}.zip`);
      showToast(`Portfolio downloaded! ${downloaded} files.`, 'success', 5000);
    } catch (err) {
      console.error('Portfolio download failed:', err);
      showToast(`Portfolio download failed: ${err.message}`, 'error', 6000);
    } finally {
      setIsDownloadingPortfolio(false);
      setPortfolioDownloadProgress('');
    }
  };

  const handleShareAll = async (allowDownload = true) => {
    if (isSharingBulk) return;
    setIsSharingBulk(true);
    showToast('Generating shareable link for portfolio...', 'info', 2000);
    
    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'create_shared_link',
          payload: {
            token,
            item_ids: ["*"],
            allow_download: allowDownload
          }
        })
      });

      if (!res.ok) throw new Error('API request failed');

      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      const permText = allowDownload ? 'Download enabled' : 'View-only';
      showToast(`Public link copied to clipboard! (${permText})`, 'success', 5000);
    } catch (err) {
      console.error('Failed to share portfolio:', err);
      showToast(`Failed to generate share link: ${err.message}`, 'error', 5000);
    } finally {
      setIsSharingBulk(false);
    }
  };

  const handleShareBulk = async (allowDownload) => {
    if (isSharingBulk) return;
    if (selectedIds.size === 0) return;
    setIsSharingBulk(true);
    showToast('Generating shareable link...', 'info', 2000);

    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const selectedArray = Array.from(selectedIds);

      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          action: 'create_shared_link',
          payload: {
            token,
            item_ids: selectedArray,
            allow_download: allowDownload
          }
        })
      });

      if (!res.ok) throw new Error('API request failed');

      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      const permText = allowDownload ? 'Download enabled' : 'View-only';
      showToast(`Shared link copied to clipboard! (${permText})`, 'success', 5000);
      clearSelection();
    } catch (err) {
      console.error('Failed to share collection:', err);
      showToast(`Failed to generate share link: ${err.message}`, 'error', 5000);
    } finally {
      setIsSharingBulk(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedIds.size === 0) return;
    showToast('Preparing ZIP download for selected items...', 'info', 2000);

    try {
      const selectedItemsList = [...activeItems, ...parkedItems].filter(item => selectedIds.has(item.id));
      
      if (selectedItemsList.length === 0) {
        showToast('No valid illustrations selected.', 'error');
        return;
      }

      const zip = new JSZip();
      let downloaded = 0;

      for (const item of selectedItemsList) {
        try {
          const filename = item.src.split('/').pop() || `${item.title || 'artwork'}.jpg`;
          const res = await fetch(`${item.src}?cache-bust=${Date.now()}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(filename, blob);
          }
          downloaded++;
        } catch (err) {
          console.warn(`Skipping download for ${item.title}:`, err);
          downloaded++;
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const date = new Date().toISOString().split('T')[0];
      saveAs(content, `daria-selected-${date}.zip`);
      showToast(`Downloaded ZIP with ${downloaded} selected file(s)!`, 'success', 5000);
      clearSelection();
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast(`ZIP generation failed: ${err.message}`, 'error', 5000);
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;

    showConfirm(
      `Are you sure you want to move the ${selectedIds.size} selected artwork(s) to the trash?`,
      async () => {
        showToast('Moving selected items to trash...', 'info', 2000);
        try {
          const selectedArray = Array.from(selectedIds);
          
          const res = await fetch('/api/admin-action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
            },
            body: JSON.stringify({
              action: 'bulk_move_to_trash',
              payload: {
                itemIds: selectedArray,
                trashItems: trashItems
              }
            })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'API request failed');
          }

          const data = await res.json();
          if (data.success) {
            showToast(`${selectedIds.size} item(s) moved to trash`, 'success');
            setTrashItems(data.trashList);
            clearSelection();
            loadGalleryItems();
          }
        } catch (err) {
          console.error("Bulk delete failed:", err);
          showToast(`Bulk delete failed: ${err.message}`, 'error', 6000);
        }
      }
    );
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 30 };

  if (isPhone) {
    return (
      <div className="mobile-restricted-overlay">
        <div className="mobile-restricted-card">
          <div className="mobile-restricted-icon">
            <Lock size={32} />
          </div>
          <h2 className="mobile-restricted-title">Admin Access Restricted</h2>
          <p className="mobile-restricted-desc">
            The creative dashboard is only accessible on Desktop or Tablet/iPad devices. Please use a larger screen to manage your portfolio.
          </p>
        </div>
      </div>
    );
  }

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
          border-radius: 12px;
          background: rgba(var(--bg-primary-rgb), 0.03);
          border: 1px solid var(--text-primary);
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
          font-family: var(--font-main);
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
          border: 1px solid var(--text-primary);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
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
          border-radius: 12px;
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
          opacity: 0.95;
          box-shadow: 0 4px 15px rgba(var(--text-primary-rgb), 0.15);
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
          font-family: var(--font-main);
          font-weight: normal;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .admin-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .admin-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .admin-gallery-grid {
            grid-template-columns: 1fr;
          }
        }

        /* 24h New Badge Styles */
        .new-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.3rem;
          z-index: 4;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .new-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        /* Custom Confirmation Modal */
        .confirm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .confirm-modal-card {
          width: 90%;
          max-width: 420px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 2.2rem;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          color: var(--text-primary);
          font-family: var(--font-main);
        }

        .confirm-modal-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        }

        .confirm-modal-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.8rem;
        }

        .confirm-modal-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 2rem;
        }

        .confirm-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-confirm {
          padding: 0.7rem 1.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-confirm.danger {
          background: #ef4444;
          color: #ffffff;
        }

        .btn-confirm.danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .btn-confirm.cancel {
          background: rgba(var(--text-primary-rgb), 0.05);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }

        .btn-confirm.cancel:hover {
          background: rgba(var(--text-primary-rgb), 0.1);
          transform: translateY(-2px);
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

        .admin-item-title-row, .parked-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          min-height: 1.5rem;
        }

        .admin-item-title, .parked-title {
          flex: 1;
        }

        .admin-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rename-trigger-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s, color 0.2s, background 0.2s;
        }

        .admin-item-card:hover .rename-trigger-btn,
        .parked-item-card:hover .rename-trigger-btn {
          opacity: 0.6;
        }

        .rename-trigger-btn:hover {
          opacity: 1 !important;
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }

        .rename-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 6px;
          padding: 2px 4px;
          width: 100%;
        }

        .rename-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 0.85rem;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          padding: 2px 4px;
        }

        .rename-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, opacity 0.2s;
        }

        .rename-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .rename-btn.confirm {
          color: #10b981;
        }

        .rename-btn.cancel {
          color: #ef4444;
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

        /* ── Sorting Mode Pill ── */
        .sort-mode-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.2rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .sort-mode-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .sort-pill {
          display: flex;
          align-items: center;
          background: rgba(var(--bg-primary-rgb), 0.04);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 4px;
          gap: 2px;
          position: relative;
        }

        .sort-pill-btn {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: var(--font-main);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 10px;
          cursor: pointer;
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .sort-pill-btn:hover {
          color: var(--text-primary);
        }

        .sort-pill-btn.active {
          color: var(--bg-primary);
        }

        .sort-pill-indicator {
          position: absolute;
          top: 4px;
          left: 4px;
          height: calc(100% - 8px);
          background: var(--text-primary);
          border-radius: 10px;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 1;
          pointer-events: none;
        }

        /* ── Manual mode controls ── */
        .manual-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.8rem;
          padding-top: 0.8rem;
          border-top: 1px solid var(--border);
          gap: 0.3rem;
        }

        .move-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          padding: 0;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .move-btn:hover:not(:disabled) {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .move-btn:disabled {
          opacity: 0.15;
          cursor: not-allowed;
        }

        .order-badge-inline {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(var(--text-primary-rgb), 0.06);
          padding: 0.2rem 0.55rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          min-width: 36px;
          text-align: center;
        }

        /* ── Order number badge (manual) ── */
        .order-badge {
          position: absolute;
          bottom: 0.7rem;
          right: 0.7rem;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(var(--text-primary-rgb), 0.06);
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          z-index: 3;
        }

        /* ── Park overlay button (on hover) ── */
        .park-overlay-btn {
          position: absolute;
          bottom: 0.8rem;
          left: 0.8rem;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.35rem 0.7rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 5;
          white-space: nowrap;
        }

        .admin-item-card:hover .park-overlay-btn {
          opacity: 1;
          transform: translateY(0);
        }

        .park-overlay-btn:hover {
          background: rgba(0,0,0,0.9);
          color: #ffffff;
        }

        /* ── Floating sticky save bar ── */
        .sticky-save-bar {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--glass-bg);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 0.8rem 1.2rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          z-index: 9000;
          font-family: var(--font-main);
        }

        .sticky-save-mode-info {
          font-size: 0.82rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sticky-save-mode-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .sticky-save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.4rem;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 0.88rem;
          font-weight: 700;
          font-family: var(--font-main);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sticky-save-btn:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .sticky-discard-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 14px;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sticky-discard-btn:hover {
          color: #ef4444;
          border-color: rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.05);
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

        /* Parked section styles */
        .parked-section {
          width: 100%;
          margin-bottom: 3.5rem;
          padding: 2.5rem 0 1rem 0;
          border-top: 1px solid var(--border);
        }

        .parked-empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          background: rgba(var(--bg-primary-rgb), 0.01);
        }

        .parked-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .parked-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .parked-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .parked-item-card {
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          position: relative;
          transition: all 0.3s ease;
        }

        .parked-item-card:hover {
          border-color: var(--text-primary);
          transform: translateY(-4px);
        }

        .parked-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: rgba(var(--bg-primary-rgb), 0.05);
          position: relative;
        }

        .parked-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .parked-item-card:hover .parked-img {
          transform: scale(1.05);
        }

        .parked-item-card:hover .delete-overlay-btn {
          opacity: 1;
          transform: scale(1);
        }

        .parked-details {
          padding: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .parked-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .publish-parked-btn {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          transition: all 0.2s ease;
        }

        .publish-parked-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* Feature Request Styles */
        .request-section {
          width: 100%;
          margin-top: 4rem;
          padding: 2.5rem 0 1rem 0;
          border-top: 1px solid var(--border);
        }

        .request-dashboard-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          width: 100%;
        }

        @media (max-width: 768px) {
          .request-dashboard-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .request-submit-panel {
          display: flex;
          flex-direction: column;
        }

        .request-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .request-list-panel {
          display: flex;
          flex-direction: column;
          background: rgba(var(--bg-primary-rgb), 0.01);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .request-list-empty {
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-align: center;
          padding: 2rem 0;
        }

        .request-list-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        /* Custom Scrollbar for request list */
        .request-list-container::-webkit-scrollbar {
          width: 6px;
        }
        .request-list-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .request-list-container::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        .request-item-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          transition: all 0.2s ease;
        }

        .request-item-card.completed {
          opacity: 0.6;
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.02);
        }

        .request-item-content {
          font-size: 0.9rem;
          color: var(--text-primary);
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .request-item-card.completed .request-item-content {
          text-decoration: line-through;
          color: var(--text-secondary);
        }

        .request-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }

        .request-item-date {
          color: var(--text-secondary);
        }

        .request-item-actions {
          display: flex;
          gap: 0.8rem;
          align-items: center;
        }

        .request-action-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: transparent;
          border: 1px solid var(--border);
          padding: 0.35rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .request-action-btn.complete-btn {
          border-color: #10b981;
          color: #10b981;
        }

        .request-action-btn.complete-btn:hover {
          background: #10b981;
          color: #ffffff;
        }

        .request-action-btn.delete-btn {
          border-color: #ef4444;
          color: #ef4444;
        }

        .request-action-btn.delete-btn:hover {
          background: #ef4444;
          color: #ffffff;
        }

        .completed-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .request-textarea {
          width: 100%;
          min-height: 120px;
          background: rgba(var(--bg-primary-rgb), 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          resize: vertical;
        }

        .request-textarea:focus {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 2px rgba(var(--text-primary), 0.1);
        }

        .request-submit-btn {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.6rem;
          font-family: var(--font-main);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          background: transparent;
          border: 1px solid var(--text-primary);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .request-submit-btn:hover:not(:disabled) {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
          transform: translateY(-2px);
        }

        .request-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Block styles */
        .mobile-restricted-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          font-family: var(--font-main);
        }

        .mobile-restricted-card {
          max-width: 400px;
          padding: 3rem 2rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .mobile-restricted-icon {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(var(--bg-primary-rgb), 0.05);
          border: 1px solid var(--border);
        }

        .mobile-restricted-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .mobile-restricted-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Selection & Floating Bulk Bar Styles */
        .select-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 12;
          cursor: pointer;
          opacity: 0;
          transform: scale(0.9);
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .select-badge.selected {
          opacity: 1 !important;
          transform: scale(1) !important;
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }

        .admin-item-card:hover .select-badge,
        .parked-item-card:hover .select-badge {
          opacity: 1;
          transform: scale(1);
        }

        .selection-active .select-badge {
          opacity: 1;
          transform: scale(1);
        }

        .admin-item-card.selected,
        .parked-item-card.selected {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
        }

        .floating-bulk-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          padding: 0.8rem 2rem;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 100px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          color: var(--text-primary);
          width: auto;
          max-width: 90vw;
        }

        .floating-bulk-info {
          font-family: var(--font-main);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .floating-bulk-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .bulk-action-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          background: rgba(var(--text-primary-rgb), 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: var(--font-main);
          transition: all 0.2s ease;
        }

        .bulk-action-btn:hover:not(:disabled) {
          background: rgba(var(--text-primary-rgb), 0.1);
          border-color: rgba(var(--text-primary-rgb), 0.2);
          transform: translateY(-1px);
        }

        .bulk-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .bulk-action-btn.danger {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .bulk-action-btn.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
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
              {[0, 1, 2, 3, 4, 5].map((idx) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {storageUsedGB !== null && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Storage Used</span>
                    <span>{storageUsedGB} GB / 10 GB</span>
                  </div>
                )}
                <div style={{ position: 'relative' }} ref={shareDropdownRef}>
                  <button 
                    onClick={() => setShowShareDropdown(prev => !prev)} 
                    disabled={isSharingBulk}
                    title="Generate a public link for the entire portfolio"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                      background: isSharingBulk ? 'rgba(100,100,100,0.15)' : 'rgba(168, 85, 247, 0.1)',
                      color: isSharingBulk ? 'var(--text-secondary)' : '#a855f7',
                      border: '1px solid ' + (isSharingBulk ? 'var(--glass-border)' : 'rgba(168, 85, 247, 0.2)'),
                      cursor: isSharingBulk ? 'wait' : 'pointer',
                      fontSize: '0.82rem', fontWeight: 600,
                      fontFamily: 'var(--font-main)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSharingBulk ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Sharing...</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={14} />
                        Share All
                      </>
                    )}
                  </button>
                  <AnimatePresence>
                    {showShareDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid var(--glass-border)', borderRadius: '12px',
                          padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem',
                          minWidth: '200px', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                      >
                        <button 
                          onClick={() => { handleShareAll(true); setShowShareDropdown(false); }}
                          style={{ justifyContent: 'flex-start', padding: '0.6rem 1rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s', fontSize: '0.85rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Download size={14} />
                          Share (Download)
                        </button>
                        <button 
                          onClick={() => { handleShareAll(false); setShowShareDropdown(false); }}
                          style={{ justifyContent: 'flex-start', padding: '0.6rem 1rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s', fontSize: '0.85rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Eye size={14} />
                          Share View-Only
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={handleDownloadPortfolio} 
                  disabled={isDownloadingPortfolio}
                  title="Download entire portfolio as ZIP"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    background: isDownloadingPortfolio ? 'rgba(100,100,100,0.15)' : 'rgba(59, 130, 246, 0.1)',
                    color: isDownloadingPortfolio ? 'var(--text-secondary)' : '#3b82f6',
                    border: '1px solid ' + (isDownloadingPortfolio ? 'var(--glass-border)' : 'rgba(59, 130, 246, 0.2)'),
                    cursor: isDownloadingPortfolio ? 'wait' : 'pointer',
                    fontSize: '0.82rem', fontWeight: 600,
                    fontFamily: 'var(--font-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDownloadingPortfolio ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{portfolioDownloadProgress || 'Preparing...'}</span>
                    </>
                  ) : (
                    <>
                      <Archive size={14} />
                      Download All
                    </>
                  )}
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="status-banner error" style={{ marginBottom: '2rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
                <button 
                  onClick={() => setErrorMsg('')}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.7, flexShrink: 0 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div className="status-banner success" style={{ marginBottom: '2rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                  <span>Artwork uploaded and color-sorted successfully! It is now live in real-time.</span>
                </div>
                <button 
                  onClick={() => setUploadSuccess(false)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', opacity: 0.7, flexShrink: 0 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                  title="Close"
                >
                  <X size={18} />
                </button>
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
              <div className="preview-card" style={{ background: 'transparent', border: '3px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button 
                      onClick={() => handleUpload(false)}
                      disabled={!selectedFile || isUploading || !analysisMeta}
                      className="action-button"
                      style={{ flex: 1 }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Publish to Gallery
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleUpload(true)}
                      disabled={!selectedFile || isUploading || !analysisMeta}
                      className="action-button"
                      style={{ 
                        flex: 1,
                        background: 'transparent',
                        border: '1px solid var(--text-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Park in Not Sure Yet
                        </>
                      )}
                    </button>
                  </div>
                  {selectedFile && !isUploading && (
                    <button 
                      onClick={handleCancelUpload}
                      className="action-button"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        fontSize: '0.9rem'
                      }}
                    >
                      <X size={16} />
                      Cancel Upload
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Not sure yet Section */}
            <div className="parked-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={20} />
                  Not sure yet ({parkedItems.length})
                </h3>
                {parkedItems.length > 0 && (
                  <button
                    onClick={selectAllParked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'transparent', border: 'none',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 500,
                      fontFamily: 'var(--font-main)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {parkedItems.every(item => selectedIds.has(item.id)) ? (
                      <>
                        <CheckSquare size={16} />
                        Deselect All Parked
                      </>
                    ) : (
                      <>
                        <Square size={16} />
                        Select All Parked
                      </>
                    )}
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Artworks parked here are hidden from the public gallery. You can publish them to the gallery with a single click.
              </p>
              
              {parkedItems.length === 0 ? (
                <div className="parked-empty-state">
                  No parked illustrations. Use the "Park in Not Sure Yet" button when uploading.
                </div>
              ) : (
                <div className={`parked-grid ${selectedIds.size > 0 ? 'selection-active' : ''}`}>
                  {parkedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`parked-item-card ${selectedIds.has(item.id) ? 'selected' : ''}`}
                      onClick={() => toggleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Selection checkbox overlay */}
                      <div 
                        className={`select-badge ${selectedIds.has(item.id) ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                      >
                        {selectedIds.has(item.id) && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownloadOriginal(item); }}
                          className="delete-overlay-btn"
                          style={{ position: 'relative', top: 0, right: 0 }}
                          aria-label="Download Original"
                          title="Download high-quality original"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                          className="delete-overlay-btn"
                          style={{ position: 'relative', top: 0, right: 0 }}
                          aria-label="Delete artwork"
                          title="Move to trash"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="parked-image-wrapper">
                        <img src={item.src} alt={item.title} className="parked-img" />
                      </div>
                      <div className="parked-details">
                        {editingId === item.id ? (
                          <div className="rename-input-wrapper" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="rename-input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm(item.id, true);
                                else if (e.key === 'Escape') handleRenameCancel();
                              }}
                              disabled={isSavingName}
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameConfirm(item.id, true)}
                              className="rename-btn confirm"
                              disabled={isSavingName}
                              title="Save title"
                            >
                              {isSavingName ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              onClick={handleRenameCancel}
                              className="rename-btn cancel"
                              disabled={isSavingName}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="parked-title-row">
                            <div className="parked-title" title={item.title}>{item.title}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameStart(item.id, item.title);
                              }}
                              className="rename-trigger-btn"
                              title="Rename illustration"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUnparkItemLocal(item); }}
                          className="publish-parked-btn"
                        >
                          <Sparkles size={12} />
                          Publish to Gallery
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Palette Section */}
            <div className="palette-section">
              <h3 className="section-header" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} />
                Your top colors
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Daria's most used color tones across all portfolio items. Click any color swatch to copy its HEX code for your design tools.
              </p>
              <div className="palette-grid">
                {getSignaturePalette([...activeItems, ...parkedItems]).map((swatch, idx) => (
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
              {/* Section header + mode switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={22} />
                  Active Portfolio ({activeItems.length})
                </h3>
                {activeItems.length > 0 && (
                  <button
                    onClick={selectAllActive}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'transparent', border: 'none',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 500,
                      fontFamily: 'var(--font-main)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {activeItems.every(item => selectedIds.has(item.id)) ? (
                      <>
                        <CheckSquare size={16} />
                        Deselect All Active
                      </>
                    ) : (
                      <>
                        <Square size={16} />
                        Select All Active
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 2-button sort pill */}
              <div className="sort-mode-bar">
                <span className="sort-mode-label">Display order</span>
                <div className="sort-pill">
                  <motion.div
                    className="sort-pill-indicator"
                    style={{ width: 'calc((100% - 8px) / 2)' }}
                    animate={{ x: sortingMode === 'manual' ? '100%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                  <button
                    className={`sort-pill-btn ${sortingMode !== 'manual' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('color')}
                    title="Click to toggle sort direction"
                  >
                    <span style={{ fontSize: '1em', lineHeight: 1 }}>
                      {sortingMode === 'chromatic_desc' ? '↓' : '↑'}
                    </span>
                    Color
                  </button>
                  <button
                    className={`sort-pill-btn ${sortingMode === 'manual' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('manual')}
                  >
                    <span style={{ fontSize: '1em', lineHeight: 1 }}>⠿</span>
                    Manual
                  </button>
                </div>
              </div>

              {isLoadingItems ? (
                <div className="flex justify-center p-12">
                  <Loader2 size={36} className="animate-spin text-purple-500" />
                </div>
              ) : activeItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">The database gallery is empty or loading.</p>
              ) : (
                <div className={`admin-gallery-grid ${selectedIds.size > 0 ? 'selection-active' : ''}`}>
                  {activeItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`admin-item-card ${selectedIds.has(item.id) ? 'selected' : ''}`}
                      onClick={() => toggleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Selection checkbox overlay */}
                      <div 
                        className={`select-badge ${selectedIds.has(item.id) ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                      >
                        {selectedIds.has(item.id) && <Check size={12} strokeWidth={3} />}
                      </div>

                      {isNew(item.created_at) && (
                        <div className="new-badge" style={{ left: '42px' }}>
                          <span className="new-dot"></span>
                          New
                        </div>
                      )}

                      {/* Action buttons wrapper (top-right) */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownloadOriginal(item); }}
                          className="delete-overlay-btn"
                          style={{ position: 'relative', top: 0, right: 0 }}
                          aria-label="Download Original"
                          title="Download high-quality original"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                          className="delete-overlay-btn"
                          style={{ position: 'relative', top: 0, right: 0 }}
                          aria-label="Delete artwork"
                          title="Move to trash"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Park button (bottom-left, appears on hover) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleParkItemLocal(index); }}
                        className="park-overlay-btn"
                        title="Move to Not Sure Yet"
                      >
                        <Lock size={11} />
                        Not sure yet
                      </button>

                      <div className="admin-item-image-wrapper">
                        <img src={item.src} alt={item.title} className="admin-item-img" />
                      </div>

                      <div className="admin-item-details">
                        {editingId === item.id ? (
                          <div className="rename-input-wrapper" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="rename-input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm(item.id, false);
                                else if (e.key === 'Escape') handleRenameCancel();
                              }}
                              disabled={isSavingName}
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameConfirm(item.id, false)}
                              className="rename-btn confirm"
                              disabled={isSavingName}
                              title="Save title"
                            >
                              {isSavingName ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              onClick={handleRenameCancel}
                              className="rename-btn cancel"
                              disabled={isSavingName}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="admin-item-title-row">
                            <div className="admin-item-title" title={item.title}>{item.title}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameStart(item.id, item.title);
                              }}
                              className="rename-trigger-btn"
                              title="Rename illustration"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
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

                        {/* Arrow controls — only in manual mode */}
                        {sortingMode === 'manual' && (
                          <div className="manual-controls">
                            <button 
                              disabled={index === 0} 
                              onClick={(e) => { e.stopPropagation(); handleMove(index, 'left'); }}
                              className="move-btn"
                              title="Move backward"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="order-badge-inline">#{index + 1}</span>
                            <button 
                              disabled={index === activeItems.length - 1} 
                              onClick={(e) => { e.stopPropagation(); handleMove(index, 'right'); }}
                              className="move-btn"
                              title="Move forward"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Request Section */}
            <div className="request-section">
              <h3 className="section-header" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} />
                Request new features or improvements
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Do you have ideas for improving the site's design or want to request new features for this admin panel? Let me know here.
              </p>
              
              <div className="request-dashboard-layout">
                {/* Submit Panel */}
                <div className="request-submit-panel">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Submit New Request</h4>
                  <form onSubmit={handleRequestSubmit} className="request-form">
                    <textarea
                      className="request-textarea"
                      placeholder="Describe your design updates or new functional ideas..."
                      value={requestContent}
                      onChange={(e) => setRequestContent(e.target.value)}
                      disabled={isSubmittingRequest}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingRequest || !requestContent.trim()}
                      className="request-submit-btn"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Submit Request
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Submitted Requests List Panel */}
                <div className="request-list-panel">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Submitted Requests</h4>
                  
                  {requests.length === 0 ? (
                    <div className="request-list-empty">
                      No requests submitted yet.
                    </div>
                  ) : (
                    <div className="request-list-container">
                      {requests.map(req => (
                        <div key={req.id} className={`request-item-card ${req.completed ? 'completed' : ''}`}>
                          <div className="request-item-content">
                            {req.content}
                          </div>
                          <div className="request-item-footer">
                            <span className="request-item-date">
                              {new Date(req.created_at).toLocaleDateString()}
                            </span>
                            <div className="request-item-actions">
                              {!req.completed && (
                                <button
                                  onClick={() => handleCompleteRequest(req.id)}
                                  className="request-action-btn complete-btn"
                                  title="Mark as completed"
                                >
                                  <CheckCircle size={14} />
                                  <span>Complete</span>
                                </button>
                              )}
                              {req.completed && (
                                <span className="completed-badge">
                                  Completed
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="request-action-btn delete-btn"
                                title="Delete request"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trash Bin Section */}
            <div className="features-section" style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px dashed var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255, 60, 60, 0.1)', color: '#ff3c3c', borderRadius: '8px' }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Trash (30 Days)</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Items are kept here for 30 days before permanent deletion from Cloudflare R2.</p>
                </div>
              </div>

              {trashItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  The trash is empty.
                </div>
              ) : (
                <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 100px))', gap: '1rem' }}>
                  {trashItems.map((item) => {
                    const daysLeft = 30 - Math.floor((Date.now() - new Date(item.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={item.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-border)', opacity: 0.8 }}>
                        <div style={{ width: '100%', paddingBottom: '100%', position: 'relative' }}>
                          <img 
                            src={item.src} 
                            alt={item.title} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }}
                          />
                        </div>
                        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.4rem', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                          <button 
                            onClick={() => handleRestore(item, false)}
                            title="Restore & Publish to Gallery"
                            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '0.25rem 0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, width: '90%', textAlign: 'center' }}
                          >
                            Pub
                          </button>
                          <button 
                            onClick={() => handleRestore(item, true)}
                            title="Restore & Park in Not Sure Yet"
                            style={{ background: 'transparent', color: '#ffffff', padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1px solid #ffffff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, width: '90%', textAlign: 'center' }}
                          >
                            Park
                          </button>
                        </div>
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'var(--bg-primary)', padding: '0.25rem 0.4rem', fontSize: '0.62rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {daysLeft}d left
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating sticky save bar */}
      <AnimatePresence>
        {isDirty && isAuthenticated && (
          <motion.div
            className="sticky-save-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="sticky-save-mode-info">
              <span className="sticky-save-mode-dot" />
              <span>
                {sortingMode === 'manual'
                  ? 'Manual order — unsaved'
                  : sortingMode === 'chromatic_desc'
                  ? 'Color ↓ — unsaved'
                  : 'Color ↑ — unsaved'}
              </span>
            </div>
            <button
              className="sticky-discard-btn"
              onClick={() => loadGalleryItems()}
              title="Discard changes"
            >
              <RefreshCw size={13} />
              Discard
            </button>
            <button
              className="sticky-save-btn"
              onClick={handleSaveChanges}
            >
              <Save size={14} />
              Publish order
            </button>
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

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            className="floating-bulk-bar"
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="floating-bulk-info">
              {selectedIds.size} item(s) selected
            </div>
            <div className="floating-bulk-actions">
              <button onClick={handleDownloadBulk} className="bulk-action-btn" title="Download selected items as ZIP">
                <Download size={14} />
                Download ZIP
              </button>
              <button onClick={() => handleShareBulk(true)} className="bulk-action-btn" disabled={isSharingBulk} title="Generate public link with download permission enabled">
                {isSharingBulk ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Share (Download)
              </button>
              <button onClick={() => handleShareBulk(false)} className="bulk-action-btn" disabled={isSharingBulk} title="Generate public link with download permission disabled">
                {isSharingBulk ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                Share View-Only
              </button>
              <button onClick={handleDeleteBulk} className="bulk-action-btn danger" title="Move selected items to trash">
                <Trash2 size={14} />
                Delete
              </button>
              <button onClick={clearSelection} className="bulk-action-btn" style={{ background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.6)' }} title="Clear selection">
                <X size={14} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== TOAST NOTIFICATIONS ==================== */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        zIndex: 10001,
        pointerEvents: 'none',
        maxWidth: '420px',
        width: '100%'
      }}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const colors = {
              success: { bg: 'rgba(16, 185, 129, 0.95)', icon: <CheckCircle size={18} />, border: 'rgba(16, 185, 129, 0.3)' },
              error: { bg: 'rgba(239, 68, 68, 0.95)', icon: <AlertCircle size={18} />, border: 'rgba(239, 68, 68, 0.3)' },
              info: { bg: 'rgba(59, 130, 246, 0.95)', icon: <Info size={18} />, border: 'rgba(59, 130, 246, 0.3)' }
            };
            const c = colors[toast.type] || colors.info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: c.bg,
                  backdropFilter: 'blur(16px)',
                  color: '#fff',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  border: `1px solid ${c.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }}
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              >
                {c.icon}
                <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
                <X size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ==================== CONFIRM DIALOG ==================== */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10002,
              padding: '1rem'
            }}
            onClick={handleConfirmNo}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
                fontFamily: 'var(--font-main)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', flexShrink: 0 }}>
                  <AlertCircle size={22} style={{ color: '#f59e0b' }} />
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                  {confirmDialog.message}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleConfirmNo}
                  style={{
                    padding: '0.6rem 1.3rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-main)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmYes}
                  style={{
                    padding: '0.6rem 1.3rem',
                    borderRadius: '8px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-main)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
