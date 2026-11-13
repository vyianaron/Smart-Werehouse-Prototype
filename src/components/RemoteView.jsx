import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  X,
  PackageCheck,
  ChevronRight,
  Layers,
  Check,
} from 'lucide-react';
import { DEFAULT_AISLES } from '../config/defaultData';
import { findItemByQuery } from '../utils/warehouseHelpers';

export default function RemoteView({
  state,
  items,
  onSelectAisle,
  onSearchItem,
  onReset,
  onConfirmPickup,
  syncStatus,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState(null); // { type: 'success' | 'error', message: string, item?: object }

  // Handle submit pencarian
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setSearchFeedback({
        type: 'error',
        message: 'Silakan masukkan nama barang yang ingin dicari.',
      });
      return;
    }

    const found = findItemByQuery(items, query);

    if (found) {
      // 2. Cari barang: lajur tetap biru redup dan LED rak barang itu berkedip hijau terang
      onSearchItem(found);
      const aisle = DEFAULT_AISLES.find((a) => a.id === found.lajur);
      setSearchFeedback({
        type: 'success',
        message: `Ditemukan: "${found.nama}" di ${aisle?.nama || `Lajur ${found.lajur}`}, Rak ${found.rak} (LED #${found.led})`,
        item: found,
      });
    } else {
      // 4. Barang tidak ditemukan: tampilkan pesan error yang jelas, LED tidak berubah
      setSearchFeedback({
        type: 'error',
        message: `Barang "${query}" tidak ditemukan di gudang. Posisi LED tidak berubah.`,
      });
    }
  };

  // Pilih langsung dari chip barang
  const handleChipClick = (item) => {
    setSearchQuery(item.nama);
    onSearchItem(item);
    const aisle = DEFAULT_AISLES.find((a) => a.id === item.lajur);
    setSearchFeedback({
      type: 'success',
      message: `Memilih "${item.nama}" di ${aisle?.nama || `Lajur ${item.lajur}`}, Rak ${item.rak} (LED #${item.led})`,
      item,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchFeedback(null);
  };

  const activeAisle = DEFAULT_AISLES.find((a) => a.id === state.lajur);
  const targetItem = state.target >= 0 ? items.find((i) => i.led === state.target) : null;

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      {/* Remote Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 text-center">
        <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
          <Smartphone className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Panel Remote Gudang
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
          Kendalikan LED maket secara instan dari genggaman ponsel Anda.
        </p>

        {/* Status Bar Aktif */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Status Saat Ini:</span>
            <span className="font-mono text-[11px]">
              Lajur: {state.lajur} | Target: {state.target >= 0 ? `#${state.target}` : 'None'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                state.target >= 0
                  ? 'bg-green-500 shadow-glow-green animate-led-blink'
                  : state.lajur > 0
                  ? 'bg-blue-500 shadow-glow-blue'
                  : 'bg-slate-400'
              }`}
            />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {state.target >= 0
                ? `LED #${state.target} (${targetItem?.nama || state.nama}) Berkedip Hijau`
                : state.lajur > 0
                ? `${activeAisle?.label || `Lajur ${state.lajur}`} Menyala Biru Redup`
                : 'Semua Lampu Gudang Mati'}
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 1: Kolom Cari Barang */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Cari Barang di Gudang
        </label>

        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: malkist roma, teh botol, spidol..."
              className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-14 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Pesan Feedback / Error Pencarian */}
        {searchFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
              searchFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {searchFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs leading-relaxed">
              <p className="font-semibold">{searchFeedback.message}</p>
              {searchFeedback.item && (
                <p className="text-[11px] opacity-80 mt-1">
                  Stok tersisa: {searchFeedback.item.stok} {searchFeedback.item.satuan}
                </p>
              )}
            </div>
            <button
              onClick={() => setSearchFeedback(null)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bagian 2: Tombol Pemilih Lajur (Snack / Minuman / Alat Tulis) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            Pilih Lajur (Semua LED Lajur Menyala Biru Redup)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DEFAULT_AISLES.map((aisle) => {
            const isSelected = state.lajur === aisle.id;
            return (
              <button
                key={aisle.id}
                onClick={() => {
                  setSearchFeedback(null);
                  onSelectAisle(aisle.id);
                }}
                className={`flex items-center justify-between sm:flex-col sm:justify-center p-3.5 rounded-xl border text-left sm:text-center transition-all active:scale-98 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:flex-col sm:gap-1.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isSelected ? 'bg-white shadow-glow-blue' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-sm block">{aisle.nama}</span>
                    <span
                      className={`text-[11px] block ${
                        isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Lajur {aisle.id} (4 Rak)
                    </span>
                  </div>
                </div>

                <div className="sm:hidden">
                  {isSelected ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagian 3: Daftar Barang yang Bisa Diketuk Langsung (Quick Chips) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            Daftar Barang (Ketuk untuk Menyorot Rak)
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {items.length} Rak Terisi
          </span>
        </div>

        <div className="space-y-3">
          {DEFAULT_AISLES.map((aisle) => {
            const aisleItems = items.filter((i) => i.lajur === aisle.id);
            return (
              <div key={aisle.id} className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Lajur {aisle.id} - {aisle.nama}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {aisleItems.map((item) => {
                    const isTarget = state.target === item.led;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleChipClick(item)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all active:scale-95 text-left ${
                          isTarget
                            ? 'bg-green-500 text-white border-green-400 shadow-md shadow-green-500/30 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/70'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="truncate">{item.nama}</p>
                          <span
                            className={`text-[10px] ${
                              isTarget ? 'text-green-100' : 'text-slate-400'
                            }`}
                          >
                            Rak {item.rak} • LED #{item.led}
                          </span>
                        </div>
                        <span
                          className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                            isTarget
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.stok}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 4: Tombol Aksi Utama (Ambil Barang & Reset) */}
      <div className="space-y-3 pt-2">
        {/* Tombol Konfirmasi Barang Sudah Diambil (Aktif saat ada target barang) */}
        {state.target >= 0 && (
          <button
            onClick={onConfirmPickup}
            className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all"
          >
            <PackageCheck className="w-5 h-5" />
            <span>Konfirmasi Barang Sudah Diambil</span>
          </button>
        )}

        {/* Tombol Reset (Semua LED Mati) */}
        <button
          onClick={() => {
            setSearchFeedback(null);
            onReset();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset (Matikan Semua LED)</span>
        </button>
      </div>
    </div>
  );
}
