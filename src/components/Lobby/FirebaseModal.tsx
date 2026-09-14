import React, { useState } from 'react';
import { Database, Key, ShieldCheck, X, Check, RefreshCw, HelpCircle } from 'lucide-react';
import type { FirebaseConfigData } from '../../types/game';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  resetFirebaseInstance,
} from '../../config/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseModal: React.FC<Props> = ({ isOpen, onClose, onConfigSaved }) => {
  const [configJson, setConfigJson] = useState<string>(() => {
    const saved = getSavedFirebaseConfig();
    return saved ? JSON.stringify(saved, null, 2) : '';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setError(null);
    try {
      if (!configJson.trim()) {
        clearFirebaseConfig();
        resetFirebaseInstance();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onConfigSaved();
          onClose();
        }, 800);
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(configJson);
      } catch {
        const formatted = configJson
          .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
          .replace(/'/g, '"');
        parsed = JSON.parse(formatted);
      }

      const cfg = parsed as Record<string, string>;
      if (!cfg.apiKey || !cfg.projectId) {
        throw new Error('Config must contain at least "apiKey" and "projectId".');
      }

      const cleanedConfig: FirebaseConfigData = {
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
        projectId: cfg.projectId,
        storageBucket: cfg.storageBucket || `${cfg.projectId}.appspot.com`,
        messagingSenderId: cfg.messagingSenderId || '',
        appId: cfg.appId || '',
      };

      saveFirebaseConfig(cleanedConfig);
      resetFirebaseInstance();

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onConfigSaved();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleResetToLocal = () => {
    clearFirebaseConfig();
    resetFirebaseInstance();
    setConfigJson('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigSaved();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-cute-lg text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#FFF0F2] border border-[#FFE4E8] rounded-2xl text-[#FF385C]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              Connect Firebase Firestore
            </h2>
            <p className="text-xs text-slate-500 font-display">
              Sync live across devices and friends with your Firestore account.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] font-display">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl text-xs text-[#059669] flex items-center gap-2 font-display">
            <Check className="w-4 h-4" /> Firebase configuration saved! Connecting...
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#FF385C]" /> Firebase Config JSON
              </label>
              <span className="text-[11px] text-slate-400">Stored in browser localStorage</span>
            </div>
            <textarea
              rows={6}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder={`{
  "apiKey": "AIzaSy...",
  "authDomain": "my-game.firebaseapp.com",
  "projectId": "my-game",
  "storageBucket": "my-game.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#FF385C] focus:bg-white shadow-cute-sm"
            />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-1 font-display">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-[#0EA5E9]" /> Quick Instructions:
            </div>
            <p>1. Copy your Web App config from Firebase Console.</p>
            <p>2. Paste above &amp; save to sync across phones and computers!</p>
            <p className="text-[#D97706] text-[11px] pt-1 font-medium">
              * Left empty, Word Blaster runs in instant offline / local demo mode.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResetToLocal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold font-display flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Local / Demo Mode
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white font-bold font-display rounded-full text-sm shadow-cute-pill flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
