/**
 * Data awal (default) untuk Smart Warehouse Prototype
 */
import { calculateLed } from '../utils/warehouseHelpers';

export const DEFAULT_AISLES = [
  {
    id: 1,
    nama: 'Snack',
    label: 'Lajur 1: Snack',
    deskripsi: 'Makanan ringan, keripik & biskuit',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    iconName: 'Cookie',
  },
  {
    id: 2,
    nama: 'Minuman',
    label: 'Lajur 2: Minuman',
    deskripsi: 'Air mineral, teh, susu & isotonik',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
    iconName: 'Coffee',
  },
  {
    id: 3,
    nama: 'Alat tulis',
    label: 'Lajur 3: Alat Tulis',
    deskripsi: 'Buku, pulpen, penggaris & spidol',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    iconName: 'PenTool',
  },
];

/**
 * 12 Barang Awal sesuai spesifikasi:
 * Snack: Chitato (rak 1), Oreo (rak 2), Malkist Roma (rak 3), Taro (rak 4)
 * Minuman: Aqua (rak 1), Teh Botol (rak 2), Pocari (rak 3), Susu Ultra (rak 4)
 * Alat tulis: Buku Tulis (rak 1), Penggaris (rak 2), Spidol (rak 3), Pulpen (rak 4)
 */
export const DEFAULT_ITEMS = [
  // --- Lajur 1: Snack (LED 0 - 3) ---
  {
    id: 'item-1-1',
    nama: 'Chitato',
    lajur: 1,
    rak: 1,
    led: calculateLed(1, 1), // 0
    stok: 15,
    satuan: 'pcs',
  },
  {
    id: 'item-1-2',
    nama: 'Oreo',
    lajur: 1,
    rak: 2,
    led: calculateLed(1, 2), // 1
    stok: 20,
    satuan: 'pcs',
  },
  {
    id: 'item-1-3',
    nama: 'Malkist Roma',
    lajur: 1,
    rak: 3,
    led: calculateLed(1, 3), // 2
    stok: 12,
    satuan: 'pcs',
  },
  {
    id: 'item-1-4',
    nama: 'Taro',
    lajur: 1,
    rak: 4,
    led: calculateLed(1, 4), // 3
    stok: 18,
    satuan: 'pcs',
  },

  // --- Lajur 2: Minuman (LED 4 - 7) ---
  {
    id: 'item-2-1',
    nama: 'Aqua',
    lajur: 2,
    rak: 1,
    led: calculateLed(2, 1), // 4
    stok: 24,
    satuan: 'botol',
  },
  {
    id: 'item-2-2',
    nama: 'Teh Botol',
    lajur: 2,
    rak: 2,
    led: calculateLed(2, 2), // 5
    stok: 20,
    satuan: 'botol',
  },
  {
    id: 'item-2-3',
    nama: 'Pocari',
    lajur: 2,
    rak: 3,
    led: calculateLed(2, 3), // 6
    stok: 16,
    satuan: 'botol',
  },
  {
    id: 'item-2-4',
    nama: 'Susu Ultra',
    lajur: 2,
    rak: 4,
    led: calculateLed(2, 4), // 7
    stok: 25,
    satuan: 'kotak',
  },

  // --- Lajur 3: Alat tulis (LED 8 - 11) ---
  {
    id: 'item-3-1',
    nama: 'Buku Tulis',
    lajur: 3,
    rak: 1,
    led: calculateLed(3, 1), // 8
    stok: 30,
    satuan: 'buah',
  },
  {
    id: 'item-3-2',
    nama: 'Penggaris',
    lajur: 3,
    rak: 2,
    led: calculateLed(3, 2), // 9
    stok: 14,
    satuan: 'buah',
  },
  {
    id: 'item-3-3',
    nama: 'Spidol',
    lajur: 3,
    rak: 3,
    led: calculateLed(3, 3), // 10
    stok: 10,
    satuan: 'buah',
  },
  {
    id: 'item-3-4',
    nama: 'Pulpen',
    lajur: 3,
    rak: 4,
    led: calculateLed(3, 4), // 11
    stok: 40,
    satuan: 'buah',
  },
];

/**
 * State default awal
 */
export const DEFAULT_STATE = {
  lajur: 0,       // 0 = semua mati, 1-3 = lajur aktif (biru redup)
  target: -1,     // -1 = tidak ada target, 0-11 = nomor LED target (hijau berkedip)
  nama: '',       // Nama barang yang sedang dicari
  ts: Date.now(), // Timestamp terakhir
};
