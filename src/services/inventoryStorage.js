/**
 * Service untuk Pengelolaan Data Barang, Stok, dan Riwayat Transaksi Keluar-Masuk
 */
import { DEFAULT_ITEMS } from '../config/defaultData';
import { calculateLed } from '../utils/warehouseHelpers';

const ITEMS_STORAGE_KEY = 'smart_warehouse_inventory_items';
const HISTORY_STORAGE_KEY = 'smart_warehouse_inventory_history';

/**
 * Mengambil seluruh daftar barang (12 rak)
 */
export function getStoredItems() {
  try {
    const raw = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch (e) {
    console.error('Error membaca data barang dari storage:', e);
  }
  // Simpan default ke storage jika belum ada
  saveItems(DEFAULT_ITEMS);
  return DEFAULT_ITEMS;
}

/**
 * Menyimpan seluruh daftar barang ke localStorage
 */
export function saveItems(items) {
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('warehouse_inventory_updated'));
    return true;
  } catch (e) {
    console.error('Error menyimpan barang:', e);
    return false;
  }
}

/**
 * Mengambil riwayat transaksi barang keluar-masuk
 */
export function getInventoryHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.error('Error membaca riwayat transaksi:', e);
  }
  return [];
}

/**
 * Menambahkan catatan log riwayat
 */
export function logTransaction({ tipe, nama, lajur, rak, jumlah, sisaStok, keterangan }) {
  const history = getInventoryHistory();
  const entry = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: Date.now(),
    tipe, // 'AMBIL' | 'TAMBAH_STOK' | 'KURANG_STOK' | 'TAMBAH_BARANG' | 'UBAH_BARANG' | 'HAPUS_BARANG'
    nama,
    lajur,
    rak,
    jumlah: Number(jumlah || 0),
    sisaStok: Number(sisaStok || 0),
    keterangan: keterangan || '',
  };

  // Simpan maksimal 100 entri terbaru
  const updatedHistory = [entry, ...history].slice(0, 100);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    window.dispatchEvent(new CustomEvent('warehouse_history_updated'));
  } catch (e) {
    console.error('Error mencatat riwayat:', e);
  }
  return entry;
}

/**
 * Ambil barang berdasarkan slot LED (0-11)
 */
export function getItemByLed(led) {
  const items = getStoredItems();
  return items.find((item) => item.led === Number(led)) || null;
}

/**
 * Update stok barang (bisa + atau -)
 * @param {string} itemId - ID barang
 * @param {number} delta - Selisih stok (+1, -1, +5, dll)
 * @param {string} tipe - 'AMBIL' | 'TAMBAH_STOK' | 'KURANG_STOK'
 * @param {string} keterangan
 */
export function adjustItemStock(itemId, delta, tipe = 'TAMBAH_STOK', keterangan = '') {
  const items = getStoredItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return null;

  const current = items[index];
  const newStock = Math.max(0, (current.stok || 0) + delta);
  
  items[index] = {
    ...current,
    stok: newStock,
  };

  saveItems(items);

  // Catat riwayat
  logTransaction({
    tipe,
    nama: current.nama,
    lajur: current.lajur,
    rak: current.rak,
    jumlah: Math.abs(delta),
    sisaStok: newStock,
    keterangan: keterangan || (delta < 0 ? `Pengurangan stok sebanyak ${Math.abs(delta)}` : `Penambahan stok sebanyak ${delta}`),
  });

  return items[index];
}

/**
 * Tambah barang baru
 */
export function addItem(itemData) {
  const items = getStoredItems();
  const lajur = Number(itemData.lajur);
  const rak = Number(itemData.rak);
  const led = calculateLed(lajur, rak);

  // Cek apakah slot rak/LED sudah ditempati
  const existingIndex = items.findIndex((i) => i.led === led);
  if (existingIndex !== -1) {
    // Jika slot sudah ditempati barang lain, tanyakan atau ganti
    throw new Error(`Slot Lajur ${lajur} Rak ${rak} (LED #${led}) sudah ditempati oleh "${items[existingIndex].nama}".`);
  }

  const newItem = {
    id: 'item-' + Date.now(),
    nama: itemData.nama.trim(),
    lajur,
    rak,
    led,
    stok: Math.max(0, Number(itemData.stok || 0)),
    satuan: itemData.satuan?.trim() || 'pcs',
  };

  items.push(newItem);
  saveItems(items);

  logTransaction({
    tipe: 'TAMBAH_BARANG',
    nama: newItem.nama,
    lajur: newItem.lajur,
    rak: newItem.rak,
    jumlah: newItem.stok,
    sisaStok: newItem.stok,
    keterangan: `Barang baru didaftarkan di Rak ${newItem.rak} (LED #${newItem.led})`,
  });

  return newItem;
}

/**
 * Update data barang (nama, stok, dll)
 */
export function updateItem(id, itemData) {
  const items = getStoredItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Barang tidak ditemukan.');

  const lajur = Number(itemData.lajur);
  const rak = Number(itemData.rak);
  const led = calculateLed(lajur, rak);

  // Jika slot rak berubah, pastikan slot tujuan belum ditempati barang lain
  const conflict = items.find((i) => i.id !== id && i.led === led);
  if (conflict) {
    throw new Error(`Slot Lajur ${lajur} Rak ${rak} (LED #${led}) sudah terisi oleh "${conflict.nama}".`);
  }

  const old = items[index];
  const updated = {
    ...old,
    nama: itemData.nama.trim(),
    lajur,
    rak,
    led,
    stok: Math.max(0, Number(itemData.stok || 0)),
    satuan: itemData.satuan?.trim() || old.satuan || 'pcs',
  };

  items[index] = updated;
  saveItems(items);

  logTransaction({
    tipe: 'UBAH_BARANG',
    nama: updated.nama,
    lajur: updated.lajur,
    rak: updated.rak,
    jumlah: updated.stok,
    sisaStok: updated.stok,
    keterangan: `Informasi barang diperbarui`,
  });

  return updated;
}

/**
 * Hapus barang
 */
export function deleteItem(id) {
  const items = getStoredItems();
  const target = items.find((i) => i.id === id);
  if (!target) return false;

  const filtered = items.filter((i) => i.id !== id);
  saveItems(filtered);

  logTransaction({
    tipe: 'HAPUS_BARANG',
    nama: target.nama,
    lajur: target.lajur,
    rak: target.rak,
    jumlah: 0,
    sisaStok: 0,
    keterangan: `Barang dihapus dari sistem gudang`,
  });

  return true;
}

/**
 * Reset seluruh barang ke konfigurasi default bawaan pabrik
 */
export function resetInventoryToDefault() {
  saveItems(DEFAULT_ITEMS);
  logTransaction({
    tipe: 'RESET',
    nama: 'Seluruh Gudang',
    lajur: 0,
    rak: 0,
    jumlah: 0,
    sisaStok: 0,
    keterangan: 'Data barang direset ke konfigurasi default (12 rak)',
  });
  return DEFAULT_ITEMS;
}
