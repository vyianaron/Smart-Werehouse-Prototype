import React from 'react';
import {
  Boxes,
  LayoutGrid,
  Smartphone,
  Package,
  Moon,
  Sun,
  Database,
  QrCode,
  Sparkles,
} from 'lucide-react';

export default function Navbar({
  currentView,
  onViewChange,
  syncStatus,
  onOpenConfig,
  onOpenQr,
  isDarkMode,
  onToggleDarkMode,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Judul Aplikasi */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Smart Warehouse
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  ESP32 Sim
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                3 Lajur • 12 Rak • Real-time Sync
              </p>
            </div>
          </div>

          {/* Navigasi Tab Tengah (Desktop / Tablet) */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => onViewChange('maket')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'maket'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Maket Simulator</span>
            </button>

            <button
              onClick={() => onViewChange('remote')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'remote'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Remote (HP)</span>
            </button>

            <button
              onClick={() => onViewChange('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kelola Barang & Stok</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Status Sync Pill (Bisa diklik untuk buka pengaturan Firebase) */}
            <button
              onClick={onOpenConfig}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                syncStatus?.isFirebase
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : syncStatus?.isLan
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
              title="Klik untuk konfigurasi Firebase Realtime Database"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus?.isFirebase
                    ? 'bg-emerald-500 animate-pulse'
                    : syncStatus?.isLan
                    ? 'bg-cyan-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="hidden sm:inline">
                {syncStatus?.isFirebase
                  ? 'Firebase Online'
                  : syncStatus?.isLan
                  ? 'Wi-Fi LAN Online'
                  : 'Mode Lokal'}
              </span>
              <Database className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* QR Code / Share to HP Button */}
            <button
              onClick={onOpenQr}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buka panel remote di Smartphone (QR Code / Link)"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Toggle Dark Mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar Mobile Navigation (Hanya muncul di HP) */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 bg-white dark:bg-slate-900 px-2 py-1.5 gap-1">
        <button
          onClick={() => onViewChange('maket')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            currentView === 'maket'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>Maket</span>
        </button>

        <button
          onClick={() => onViewChange('remote')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            currentView === 'remote'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4 mb-0.5" />
          <span>Remote</span>
        </button>

        <button
          onClick={() => onViewChange('inventory')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            currentView === 'inventory'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span>Barang</span>
        </button>
      </div>
    </header>
  );
}
