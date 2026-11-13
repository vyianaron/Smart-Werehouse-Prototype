/**
 * Helper utility functions untuk Smart Warehouse
 */

/**
 * Menghitung indeks nomor LED (0 - 11) dari nomor lajur (1 - 3) dan rak (1 - 4)
 * Rumus: led = (lajur - 1) * 4 + (rak - 1)
 */
export function calculateLed(lajur, rak) {
  return (lajur - 1) * 4 + (rak - 1);
}

/**
 * Mengubah indeks nomor LED (0 - 11) kembali ke nomor lajur dan rak
 */
export function getLajurAndRakFromLed(led) {
  if (led < 0 || led > 11) return { lajur: 0, rak: 0 };
  const lajur = Math.floor(led / 4) + 1;
  const rak = (led % 4) + 1;
  return { lajur, rak };
}

/**
 * Normalisasi string pencarian: huruf kecil dan buang spasi berlebih
 */
export function normalizeSearch(str) {
  return (str || '').toLowerCase().trim();
}

/**
 * Mencari barang berdasarkan kata kunci pencarian (tidak peka huruf besar & substring match)
 * @param {Array} items - Daftar barang
 * @param {string} query - Kata kunci pencarian
 * @returns {Object|null} Barang yang ditemukan atau null
 */
export function findItemByQuery(items, query) {
  const q = normalizeSearch(query);
  if (!q) return null;

  // Prioritaskan kecocokan persis (exact match), jika tidak ada cari substring (partial match)
  const exactMatch = items.find(
    (item) => normalizeSearch(item.nama) === q
  );
  if (exactMatch) return exactMatch;

  return items.find((item) =>
    normalizeSearch(item.nama).includes(q)
  ) || null;
}

/**
 * Format tanggal dan waktu ke format Indonesia
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ', ' + d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
