import React, { useState, useEffect } from 'react';
import { X, Smartphone, Wifi, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

export default function QrShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'remote');
      setCurrentUrl(url.toString());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate an embeddable QR Code image URL using quickchart.io or api.qrserver.com
  // With fallback to copyable URL
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Buka Remote di HP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan ponsel pintar Anda sebagai remote kontrol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Wi-Fi */}
        <div className="my-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5 text-left">
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span>Pastikan Laptop dan HP Anda terhubung pada jaringan Wi-Fi yang sama (atau Hotspot HP).</span>
        </div>

        {/* QR Code Frame */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block mx-auto my-2 shadow-inner">
          <img
            src={qrCodeImageUrl}
            alt="QR Code Remote"
            className="w-48 h-48 rounded-lg mx-auto bg-white p-1"
            onError={(e) => {
              // Jika offline, sembunyikan gambar dan tampilkan pesan link
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Scan dengan kamera HP untuk langsung membuka panel remote
          </p>
        </div>

        {/* Copyable Link */}
        <div className="mt-4 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Atau Buka Tautan Ini di Browser HP:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white select-all"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            * Jika url memakai <code>localhost</code>, gantikan dengan IP lokal laptop (misal: <code>http://192.168.1.xxx:5173/?view=remote</code>).
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
