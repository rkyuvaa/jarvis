import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { extractEventFromImage } from '../lib/gemini';
import { geocodeAddress } from '../lib/maps';
import { createAutoReminders } from '../lib/reminderEngine';

/**
 * PhotoUploader — drag-drop image upload with Gemini extraction and Supabase save
 */
export default function PhotoUploader({ userId, onEventCreated, onClose }) {
  const [phase, setPhase] = useState('idle'); // idle | uploading | scanning | confirming | saving | done | error
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setError(null);
    setPhase('uploading');
    setProgress(20);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileData(file);

    try {
      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('jarvis-uploads')
        .upload(fileName, file, { upsert: false });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('jarvis-uploads')
        .getPublicUrl(fileName);

      setProgress(50);
      setPhase('scanning');

      // Convert to base64 for Gemini
      const base64 = await toBase64(file);
      const result = await extractEventFromImage(base64, file.type);

      setProgress(80);
      setExtracted({ ...result, _imageUrl: publicUrl });
      setEditData({
        title: result.title || '',
        event_type: result.event_type || 'general',
        date: result.date || '',
        time: result.time || '',
        venue_name: result.venue_name || '',
        address: result.address || '',
        notes: result.notes || '',
        _imageUrl: publicUrl,
      });
      setPhase('confirming');
      setProgress(100);
    } catch (e) {
      console.error('[PhotoUploader]', e);
      setError(e.message || 'Scan failed. Please try again.');
      setPhase('error');
    }
  }, [userId]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = async () => {
    if (!editData) return;
    setPhase('saving');

    try {
      // Geocode if address provided
      let lat = null, lng = null;
      if (editData.address) {
        const geo = await geocodeAddress(editData.address);
        if (geo) { lat = geo.lat; lng = geo.lng; }
      }

      // Save event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: editData.title,
          event_type: editData.event_type,
          event_date: editData.date
            ? new Date(editData.date).toISOString()
            : new Date().toISOString(),
          event_time: editData.time || null,
          location_name: editData.venue_name || null,
          location_address: editData.address || null,
          latitude: lat,
          longitude: lng,
          description: editData.notes || null,
          source: 'photo',
          source_image_url: editData._imageUrl,
          raw_extraction: extracted,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create auto reminders
      if (extracted?.auto_reminders?.length && editData.date) {
        await createAutoReminders(userId, event.id, editData.date, extracted.auto_reminders);
      }

      // Save photo scan log
      await supabase.from('photo_scans').insert({
        user_id: userId,
        image_url: editData._imageUrl,
        gemini_response: extracted,
        linked_event_id: event.id,
      });

      setPhase('done');
      onEventCreated?.(event);

      // Auto-close after 2s
      setTimeout(() => onClose?.(), 2000);
    } catch (e) {
      console.error('[PhotoUploader save]', e);
      setError(e.message);
      setPhase('error');
    }
  };

  // ── IDLE / DROP ZONE ──────────────────────────────────────────
  if (phase === 'idle' || phase === 'error') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>
            SCAN PHOTO
          </h2>
          {onClose && (
            <button onClick={onClose} className="text-muted hover:text-text transition-colors">
              <X size={16} style={{ color: 'var(--j-muted)' }} />
            </button>
          )}
        </div>

        <div
          className={`drop-zone rounded-sm p-12 flex flex-col items-center justify-center gap-4 cursor-pointer ${dragOver ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative">
            <Upload size={40} style={{ color: dragOver ? 'var(--j-cyan)' : 'var(--j-muted)' }} />
            {dragOver && (
              <div className="absolute inset-0 animate-ping opacity-30">
                <Upload size={40} style={{ color: 'var(--j-cyan)' }} />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs font-display tracking-widest uppercase" style={{ color: dragOver ? 'var(--j-cyan)' : 'var(--j-text)' }}>
              {dragOver ? 'RELEASE TO SCAN' : 'DROP IMAGE HERE'}
            </p>
            <p className="text-[10px] font-mono-data mt-1" style={{ color: 'var(--j-muted)' }}>
              or click to browse · JPG, PNG, WEBP
            </p>
          </div>
          <button className="hud-btn cyan sm flex items-center gap-2">
            <Camera size={12} />
            <span>SELECT FILE</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />

        {error && (
          <div
            className="mt-4 p-3 flex items-center gap-2 border"
            style={{ borderColor: 'var(--j-red)', background: 'rgba(255,56,96,0.08)' }}
          >
            <AlertCircle size={14} style={{ color: 'var(--j-red)' }} />
            <span className="text-xs font-mono-data" style={{ color: 'var(--j-red)' }}>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ── UPLOADING / SCANNING ──────────────────────────────────────
  if (phase === 'uploading' || phase === 'scanning') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>
            {phase === 'uploading' ? 'UPLOADING...' : 'SCANNING WITH GEMINI AI...'}
          </h2>
        </div>

        {preview && (
          <div className="relative mb-6 scan-animation" style={{ height: '200px' }}>
            <img
              src={preview}
              alt="Scanning"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.5) hue-rotate(180deg) saturate(2)' }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(2,11,20,0.6)' }}
            >
              <div className="text-center">
                <Loader size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--j-cyan)' }} />
                <p className="text-[10px] font-display tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>
                  {phase === 'uploading' ? 'UPLOADING IMAGE...' : 'EXTRACTING EVENT DATA...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: 'var(--j-border)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--j-blue), var(--j-cyan))',
              boxShadow: '0 0 8px var(--j-cyan)',
            }}
          />
        </div>
        <p className="text-[9px] font-mono-data mt-2" style={{ color: 'var(--j-muted)' }}>
          {progress}% COMPLETE
        </p>
      </div>
    );
  }

  // ── CONFIRMATION PANEL ────────────────────────────────────────
  if (phase === 'confirming' && editData) {
    return (
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>
            EXTRACTION COMPLETE
          </h2>
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="text-[9px] font-display tracking-widest" style={{ color: 'var(--j-green)' }}>
              {Math.round((extracted?.confidence || 0) * 100)}% CONFIDENCE
            </span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {preview && (
            <img
              src={preview}
              alt="Scanned"
              className="w-24 h-24 object-cover flex-shrink-0"
              style={{ border: '1px solid var(--j-border)', filter: 'brightness(0.8)' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-display tracking-widest uppercase mb-1" style={{ color: 'var(--j-muted)' }}>
              GEMINI DETECTED
            </p>
            <p className="text-xs font-mono-data" style={{ color: 'var(--j-text)' }}>
              {extracted?.event_type?.toUpperCase()} EVENT
            </p>
            {extracted?.host_names?.length > 0 && (
              <p className="text-[10px] font-mono-data mt-1" style={{ color: 'var(--j-muted)' }}>
                Hosts: {extracted.host_names.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="hud-divider" />

        <div className="space-y-4">
          <div>
            <label className="label-xs block mb-1">EVENT TITLE</label>
            <input
              className="hud-input"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Event name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs block mb-1">DATE</label>
              <input
                type="date"
                className="hud-input"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label-xs block mb-1">TIME</label>
              <input
                type="time"
                className="hud-input"
                value={editData.time}
                onChange={(e) => setEditData({ ...editData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-xs block mb-1">VENUE NAME</label>
            <input
              className="hud-input"
              value={editData.venue_name}
              onChange={(e) => setEditData({ ...editData, venue_name: e.target.value })}
              placeholder="Venue or location name"
            />
          </div>

          <div>
            <label className="label-xs block mb-1">ADDRESS</label>
            <input
              className="hud-input"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Full address for geocoding"
            />
          </div>

          <div>
            <label className="label-xs block mb-1">NOTES</label>
            <textarea
              className="hud-input"
              rows={3}
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Additional details"
              style={{ resize: 'vertical' }}
            />
          </div>

          {extracted?.auto_reminders?.length > 0 && (
            <div className="p-3 border" style={{ borderColor: 'rgba(57,211,83,0.3)', background: 'rgba(57,211,83,0.05)' }}>
              <p className="text-[9px] font-display tracking-widest uppercase mb-2" style={{ color: 'var(--j-green)' }}>
                AUTO REMINDERS TO CREATE
              </p>
              {extracted.auto_reminders.map((r, i) => (
                <p key={i} className="text-[10px] font-mono-data" style={{ color: 'var(--j-muted)' }}>
                  › {r.title} ({r.advance_days}d before, {r.recurrence})
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleConfirm} className="hud-btn green flex-1 flex items-center justify-center gap-2">
            <CheckCircle size={14} />
            <span>LOCK IT IN</span>
          </button>
          <button onClick={onClose} className="hud-btn" style={{ borderColor: 'var(--j-muted)', color: 'var(--j-muted)' }}>
            <span>CANCEL</span>
          </button>
        </div>
      </div>
    );
  }

  // ── SAVING ────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4" style={{ minHeight: '200px' }}>
        <Loader size={32} className="animate-spin" style={{ color: 'var(--j-cyan)' }} />
        <p className="text-xs font-display tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>
          SAVING TO DATABASE...
        </p>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4" style={{ minHeight: '200px' }}>
        <CheckCircle size={48} style={{ color: 'var(--j-green)' }} />
        <p className="text-sm font-display tracking-widest uppercase" style={{ color: 'var(--j-green)' }}>
          LOCKED IN
        </p>
        <p className="text-[10px] font-mono-data" style={{ color: 'var(--j-muted)' }}>
          Event saved. Reminders created.
        </p>
      </div>
    );
  }

  return null;
}
