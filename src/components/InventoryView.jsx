import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  Box,
} from 'lucide-react';
import { DEFAULT_AISLES } from '../config/defaultData';
import {
  addItem,
  updateItem,
  deleteItem,
  adjustItemStock,
  getInventoryHistory,
  resetInventoryToDefault,
} from '../services/inventoryStorage';
import { formatDateTime, calculateLed } from '../utils/warehouseHelpers';

export default function InventoryView({ items, onItemsUpdated }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedAisleFilter, setSelectedAisleFilter] = useState(0); // 0 = all
  const [historyTab, setHistoryTab] = useState(false); // false = inventory list, true = history log

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    lajur: 1,
    rak: 1,
    stok: 10,
    satuan: 'pcs',
  });
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const history = getInventoryHistory();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      nama: '',
      lajur: 1,
      rak: 1,
      stok: 10,
      satuan: 'pcs',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      lajur: item.lajur,
      rak: item.rak,
      stok: item.stok,
      satuan: item.satuan || 'pcs',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama barang wajib diisi.');
      return;
    }

    try {
      if (editingItem) {
        updateItem(editingItem.id, formData);
        showToast(`Barang "${formData.nama}" berhasil diperbarui.`);
      } else {
        addItem(formData);
        showToast(`Barang "${formData.nama}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      onItemsUpdated();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan barang.');
    }
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`Yakin ingin menghapus "${item.nama}" dari Rak ${item.rak}?`)) {
      deleteItem(item.id);
      showToast(`Barang "${item.nama}" telah dihapus.`);
      onItemsUpdated();
    }
  };

  const handleStockDelta = (item, delta) => {
    const tipe = delta > 0 ? 'TAMBAH_STOK' : 'KURANG_STOK';
    adjustItemStock(item.id, delta, tipe, `Penyesuaian cepat (+/-) dari halaman inventaris`);
    onItemsUpdated();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset seluruh data barang ke 12 barang bawaan awal? Data kustom akan hilang.')) {
      resetInventoryToDefault();
      showToast('Data barang berhasil dikembalikan ke default.');
      onItemsUpdated();
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchSearch = item.nama.toLowerCase().includes(filterQuery.toLowerCase());
    const matchAisle = selectedAisleFilter === 0 || item.lajur === selectedAisleFilter;
    return matchSearch && matchAisle;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Kelola Barang & Stok Gudang
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur penempatan 12 rak, pantau ketersediaan stok, dan tinjau riwayat keluar-masuk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            title="Kembalikan ke 12 barang default"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>
      </div>

      {/* Tab Navigasi: Daftar Barang vs Riwayat Keluar-Masuk */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setHistoryTab(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            !historyTab
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Daftar Barang ({items.length})</span>
        </button>

        <button
          onClick={() => setHistoryTab(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            historyTab
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Keluar-Masuk ({history.length})</span>
        </button>
      </div>

      {!historyTab ? (
        /* TAB 1: DAFTAR BARANG */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedAisleFilter(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedAisleFilter === 0
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Semua Lajur
              </button>
              {DEFAULT_AISLES.map((aisle) => (
                <button
                  key={aisle.id}
                  onClick={() => setSelectedAisleFilter(aisle.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedAisleFilter === aisle.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {aisle.nama}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid Barang */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const aisle = DEFAULT_AISLES.find((a) => a.id === item.lajur);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {aisle?.nama || `Lajur ${item.lajur}`} • Rak {item.rak}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        LED #{item.led}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {item.nama}
                    </h3>
                  </div>

                  {/* Stock Counter + Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStockDelta(item, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition-all active:scale-90"
                        title="Kurangi 1"
                      >
                        -
                      </button>
                      <div className="text-center min-w-[50px]">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {item.stok}
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-1">
                          {item.satuan}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStockDelta(item, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition-all active:scale-90"
                        title="Tambah 1"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        title="Ubah Barang"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                        title="Hapus Barang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 2: RIWAYAT KELUAR-MASUK */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Catatan Log Aktivitas Barang
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total {history.length} Catatan
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada riwayat transaksi barang.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto">
              {history.map((entry) => {
                const isAmbil = entry.tipe === 'AMBIL' || entry.tipe === 'KURANG_STOK';
                return (
                  <div key={entry.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isAmbil
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {isAmbil ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {entry.nama}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {entry.tipe}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.keterangan || (entry.lajur ? `Lajur ${entry.lajur}, Rak ${entry.rak}` : '-')}
                        </p>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold text-sm ${
                          isAmbil ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isAmbil ? `-${entry.jumlah}` : `+${entry.jumlah}`}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Sisa: {entry.sisaStok}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / UBAH BARANG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Ubah Data Barang' : 'Tambah Barang ke Rak'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tentukan posisi lajur (1-3) dan rak (1-4) untuk memetakan nomor LED.
            </p>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Beng-beng, Kopi Kenangan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lajur (1 - 3) *
                  </label>
                  <select
                    value={formData.lajur}
                    onChange={(e) => setFormData({ ...formData, lajur: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1: Snack</option>
                    <option value={2}>2: Minuman</option>
                    <option value={3}>3: Alat Tulis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Rak (1 - 4) *
                  </label>
                  <select
                    value={formData.rak}
                    onChange={(e) => setFormData({ ...formData, rak: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Rak 1</option>
                    <option value={2}>Rak 2</option>
                    <option value={3}>Rak 3</option>
                    <option value={4}>Rak 4</option>
                  </select>
                </div>
              </div>

              {/* Info LED yang terpetakan otomatis */}
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-xs text-blue-700 dark:text-blue-300">
                Alamat LED: <span className="font-mono font-bold">LED #{calculateLed(formData.lajur, formData.rak)}</span> (GPIO 5)
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    placeholder="pcs / botol"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/25"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Daftarkan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
