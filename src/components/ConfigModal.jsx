import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ClipboardPaste,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
} from '../config/firebase';
import { reconnectFirebase } from '../services/warehouseSync';

export default function ConfigModal({ isOpen, onClose, currentStatus }) {
  const [apiKey, setApiKey] = useState('');
  const [databaseURL, setDatabaseURL] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonBox, setShowJsonBox] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedFirebaseConfig();
      if (saved) {
        setApiKey(saved.apiKey || '');
        setDatabaseURL(saved.databaseURL || '');
        setProjectId(saved.projectId || '');
        setAuthDomain(saved.authDomain || '');
        setStorageBucket(saved.storageBucket || '');
        setMessagingSenderId(saved.messagingSenderId || '');
        setAppId(saved.appId || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      // Bersihkan string jika ada "const firebaseConfig = "
      let cleaned = jsonInput.trim();
      if (cleaned.includes('=')) {
        cleaned = cleaned.substring(cleaned.indexOf('=') + 1);
      }
      if (cleaned.endsWith(';')) {
        cleaned = cleaned.slice(0, -1);
      }
      const parsed = JSON.parse(cleaned);

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.databaseURL) setDatabaseURL(parsed.databaseURL);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);

      setShowJsonBox(false);
      setMessage({ type: 'success', text: 'Konfigurasi JSON berhasil diekstrak ke formulir!' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal membaca format JSON. Pastikan berupa objek valid.' });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey || !databaseURL) {
      setMessage({
        type: 'error',
        text: 'API Key dan Database URL wajib diisi untuk Firebase Realtime Database.',
      });
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      databaseURL: databaseURL.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);
    reconnectFirebase();
    setMessage({
      type: 'success',
      text: 'Konfigurasi tersimpan! Sistem sedang menghubungkan ke Firebase Cloud...',
    });

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (window.confirm('Gunakan Mode Lokal saja? Aplikasi akan tetap sinkron antar-tab di perangkat ini tanpa cloud.')) {
      clearFirebaseConfig();
      setApiKey('');
      setDatabaseURL('');
      setProjectId('');
      reconnectFirebase();
      setMessage({ type: 'info', text: 'Kembali ke Mode Lokal (BroadcastChannel).' });
      setTimeout(() => onClose(), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Pengaturan Sinkronisasi Firebase
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan ke Firebase Realtime Database untuk sinkronisasi antar HP & ESP32
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Status Koneksi Saat Ini:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              currentStatus?.isFirebase
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus?.isFirebase ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {currentStatus?.isFirebase ? 'Firebase Realtime Online' : 'Mode Lokal (Broadcast)'}
          </span>
        </div>

        {/* Alerts */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Step-by-Step Mini Guide */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>Panduan Cepat Pemula (Gratis):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
            <li>
              Buka{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"
              >
                console.firebase.google.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              dan buat project baru.
            </li>
            <li>Di menu samping, pilih <b>Build &gt; Realtime Database</b> &gt; Klik <b>Create Database</b>.</li>
            <li>Pilih mode <b>Start in test mode</b> (agar read/write diizinkan).</li>
            <li>Di <b>Project Settings &gt; General &gt; Your apps &gt; Web (&lt;/&gt;)</b>, salin objek config.</li>
          </ol>
        </div>

        {/* Quick Paste Button */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowJsonBox(!showJsonBox)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{showJsonBox ? 'Tutup Kotak Tempel JSON' : 'Tempel Objek JSON Firebase Config Sekaligus'}</span>
          </button>
        </div>

        {showJsonBox && (
          <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Contoh:\n{\n  "apiKey": "AIzaSy...",\n  "databaseURL": "https://gudang-default-rtdb.firebaseio.com",\n  "projectId": "gudang-123"\n}`}
              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleParseJson}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Terapkan JSON ke Formulir
            </button>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Database URL * <span className="font-normal text-slate-400">(contoh: https://my-proj-default-rtdb.firebaseio.com)</span>
            </label>
            <input
              type="url"
              required
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              API Key *
            </label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="smart-warehouse-xyz"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="smart-warehouse.firebaseapp.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Gunakan Mode Lokal Saja</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/25"
              >
                Simpan & Hubungkan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
