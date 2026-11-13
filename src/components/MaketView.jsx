import React from 'react';
import { Package, RotateCcw, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import LedIndicator from './LedIndicator';
import { DEFAULT_AISLES } from '../config/defaultData';
import { formatDateTime } from '../utils/warehouseHelpers';

export default function MaketView({
  state,
  items,
  onReset,
  onConfirmPickup,
  onSelectRack,
}) {
  // Hitung status LED per indeks (0 - 11)
  const getLedStatus = (ledIndex, itemLajur) => {
    // 1. Jika ini target spesifik yang dicari, harus hijau berkedip
    if (state.target === ledIndex) {
      return 'blink-green';
    }
    // 2. Jika lajur rak ini adalah lajur yang aktif, harus biru redup
    if (state.lajur > 0 && state.lajur === itemLajur) {
      return 'dim-blue';
    }
    // 3. Sisanya mati
    return 'off';
  };

  const activeAisle = DEFAULT_AISLES.find((a) => a.id === state.lajur);
  const targetItem = state.target >= 0 ? items.find((i) => i.led === state.target) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner Status Hardware & State */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Maket Simulator 12 LED
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Update: {formatDateTime(state.ts)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Visualisasi Fisik Rak Gudang
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Mensimulasikan susunan 3 lajur x 4 rak (12 LED WS2812B GPIO 5) secara real-time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {state.target >= 0 && (
              <button
                onClick={onConfirmPickup}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Barang Sudah Diambil</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset LED</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators Card */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Lajur Aktif */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Lajur Aktif
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  state.lajur > 0 ? 'bg-blue-500 shadow-glow-blue' : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {state.lajur > 0 ? `${activeAisle?.label || `Lajur ${state.lajur}`}` : 'Tidak Ada (Mati)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {state.lajur > 0 ? 'Semua LED lajur menyala biru redup' : 'Semua LED lajur dalam keadaan off'}
            </p>
          </div>

          {/* Status Target Barang */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Target Barang (LED Berkedip)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  state.target >= 0 ? 'bg-green-500 shadow-glow-green animate-led-blink' : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {state.target >= 0
                  ? `${targetItem?.nama || state.nama || `LED #${state.target}`}`
                  : 'Tidak Ada Target'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {state.target >= 0
                ? `LED #${state.target} di Rak ${targetItem?.rak || (state.target % 4) + 1} berkedip hijau`
                : 'Tidak ada LED yang berkedip'}
            </p>
          </div>

          {/* Status Warna Lampu Hardware */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Legenda Simulator LED
            </span>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="text-slate-600 dark:text-slate-400">Mati</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-glow-blue" />
                <span className="text-slate-600 dark:text-slate-400">Biru Redup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-glow-green animate-pulse" />
                <span className="text-slate-600 dark:text-slate-400">Hijau Kedip</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3 Lajur x 4 Rak Gudang */}
      <div className="space-y-6">
        {DEFAULT_AISLES.map((aisle) => {
          const isAisleActive = state.lajur === aisle.id;
          const aisleItems = items.filter((item) => item.lajur === aisle.id);

          return (
            <div
              key={aisle.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isAisleActive
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-400/60 dark:border-blue-700/60 shadow-md ring-1 ring-blue-400/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Header Lajur */}
              <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isAisleActive
                        ? 'bg-blue-500 shadow-glow-blue ring-4 ring-blue-500/20'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {aisle.label}
                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${aisle.badgeColor}`}>
                        {aisle.nama}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {aisle.deskripsi} • LED #{(aisle.id - 1) * 4} s/d #{aisle.id * 4 - 1}
                    </p>
                  </div>
                </div>

                {isAisleActive && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/50 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    Lajur Menyala Biru Redup
                  </span>
                )}
              </div>

              {/* 4 Rak dalam Lajur Ini */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((rakNum) => {
                  const item = aisleItems.find((i) => i.rak === rakNum);
                  const ledNumber = (aisle.id - 1) * 4 + (rakNum - 1);
                  const ledStatus = getLedStatus(ledNumber, aisle.id);
                  const isTarget = state.target === ledNumber;

                  return (
                    <div
                      key={rakNum}
                      onClick={() => onSelectRack && item && onSelectRack(item)}
                      className={`relative group rounded-xl p-4 border transition-all duration-300 cursor-pointer ${
                        isTarget
                          ? 'bg-green-50 dark:bg-green-950/40 border-green-500 ring-2 ring-green-500/40 shadow-glow-green scale-[1.02]'
                          : ledStatus === 'dim-blue'
                          ? 'bg-white dark:bg-slate-800/90 border-blue-300 dark:border-blue-700/60 shadow-sm hover:border-blue-400'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top bar rak: Label Rak & LED */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Rak {rakNum}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            LED #{ledNumber}
                          </span>
                        </div>
                      </div>

                      {/* Main Visual: Hardware LED Simulator */}
                      <div className="my-4 flex flex-col items-center justify-center py-2">
                        <LedIndicator
                          ledIndex={ledNumber}
                          status={ledStatus}
                          size="lg"
                        />
                        <span
                          className={`text-[11px] font-semibold mt-2.5 transition-colors ${
                            isTarget
                              ? 'text-green-700 dark:text-green-300 font-bold animate-pulse'
                              : ledStatus === 'dim-blue'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isTarget
                            ? '● Berkedip Hijau'
                            : ledStatus === 'dim-blue'
                            ? '● Biru Redup'
                            : '○ Lampu Mati'}
                        </span>
                      </div>

                      {/* Info Barang di Rak */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        {item ? (
                          <>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={item.nama}>
                              {item.nama}
                            </h4>
                            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>Stok:</span>
                              <span className={`font-semibold ${item.stok <= 5 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.stok} {item.satuan || 'pcs'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-1">
                            <span className="text-xs text-slate-400 italic">Rak Kosong</span>
                          </div>
                        )}
                      </div>

                      {/* Tooltip hint on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-2 -bottom-2 text-center pointer-events-none">
                        <span className="inline-block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-lg">
                          Klik untuk pilih rak ini
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
