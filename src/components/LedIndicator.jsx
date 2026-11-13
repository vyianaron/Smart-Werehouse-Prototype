import React from 'react';

/**
 * Komponen Visualisasi LED WS2812B
 *
 * @param {number} ledIndex - Nomor LED (0 - 11)
 * @param {'off' | 'dim-blue' | 'blink-green'} status - Kondisi nyala LED
 * @param {boolean} showLabel - Apakah nomor LED ditampilkan di tengah atau samping
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function LedIndicator({ ledIndex, status = 'off', size = 'md', showLabel = true }) {
  const isOff = status === 'off';
  const isDimBlue = status === 'dim-blue';
  const isBlinkGreen = status === 'blink-green';

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
  }[size] || 'w-10 h-10 text-xs';

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Outer Glow Ring jika Berkedip Hijau */}
      {isBlinkGreen && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping-slow" />
      )}

      {/* Lingkaran LED Utama */}
      <div
        className={`relative inline-flex items-center justify-center rounded-full font-mono font-bold transition-all duration-300 ${sizeClasses} ${
          isBlinkGreen
            ? 'bg-green-400 text-slate-950 shadow-glow-green animate-led-blink border-2 border-green-200'
            : isDimBlue
            ? 'bg-blue-600 text-blue-100 shadow-glow-blue border border-blue-400/60 opacity-90'
            : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-400/30 dark:border-slate-700 opacity-60'
        }`}
        title={`LED #${ledIndex}: ${
          isBlinkGreen
            ? 'Hijau Berkedip (Barang Ditemukan)'
            : isDimBlue
            ? 'Biru Redup (Lajur Aktif)'
            : 'Mati'
        }`}
      >
        {showLabel && (
          <span className="tracking-tighter">
            {ledIndex}
          </span>
        )}
      </div>
    </div>
  );
}
