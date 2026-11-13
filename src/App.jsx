import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MaketView from './components/MaketView';
import RemoteView from './components/RemoteView';
import InventoryView from './components/InventoryView';
import ConfigModal from './components/ConfigModal';
import QrShareModal from './components/QrShareModal';
import {
  subscribeWarehouseState,
  pushWarehouseState,
  resetWarehouseState,
} from './services/warehouseSync';
import {
  getStoredItems,
  adjustItemStock,
} from './services/inventoryStorage';
import { DEFAULT_STATE } from './config/defaultData';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [warehouseState, setWarehouseState] = useState(DEFAULT_STATE);
  const [syncStatus, setSyncStatus] = useState({
    status: 'connecting',
    isFirebase: false,
    message: 'Memulai...',
  });
  const [items, setItems] = useState([]);
  const [currentView, setCurrentView] = useState('maket'); // 'maket' | 'remote' | 'inventory'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const showToast = (message) => {
    setToastNotification(message);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // 1. Inisialisasi Tema (Dark Mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('smart_warehouse_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('smart_warehouse_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('smart_warehouse_theme', 'light');
      }
      return next;
    });
  };

  // 2. Inisialisasi View dari Query Param URL (?view=remote atau ?view=maket)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['maket', 'remote', 'inventory'].includes(viewParam)) {
      setCurrentView(viewParam);
    }
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    // Update URL query param tanpa reload halaman
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url);
  };

  // 3. Load & Reload Data Barang
  const refreshItems = useCallback(() => {
    const loaded = getStoredItems();
    setItems(loaded);
  }, []);

  useEffect(() => {
    refreshItems();
    window.addEventListener('warehouse_inventory_updated', refreshItems);
    return () => {
      window.removeEventListener('warehouse_inventory_updated', refreshItems);
    };
  }, [refreshItems]);

  // 4. Hubungkan ke Unified Sync Engine (Firebase + Local BroadcastChannel)
  useEffect(() => {
    const unsubscribe = subscribeWarehouseState(
      (newState) => {
        setWarehouseState(newState);
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Handlers Aksi Gudang ---

  // Perilaku 1: Pilih Lajur -> seluruh LED di lajur itu menyala biru redup
  const handleSelectAisle = async (lajurId) => {
    await pushWarehouseState({
      lajur: Number(lajurId),
      target: -1,
      nama: '',
    });
  };

  // Perilaku 2: Cari Barang -> lajur barang tetap biru redup dan LED rak barang itu berkedip hijau terang
  const handleSearchItem = async (item) => {
    if (!item) return;
    await pushWarehouseState({
      lajur: Number(item.lajur),
      target: Number(item.led),
      nama: item.nama,
    });
  };

  // Perilaku 3: Reset -> semua LED mati
  const handleReset = async () => {
    await resetWarehouseState();
    showToast('Semua LED telah dimatikan (Reset).');
  };

  // Fitur Tambahan: Konfirmasi "Barang sudah diambil"
  const handleConfirmPickup = async () => {
    if (warehouseState.target < 0) return;

    // Cari barang yang sesuai dengan target LED
    const targetItem = items.find((i) => i.led === warehouseState.target);
    const itemName = targetItem ? targetItem.nama : (warehouseState.nama || `LED #${warehouseState.target}`);

    if (targetItem) {
      // Kurangi stok 1 dan catat riwayat
      adjustItemStock(targetItem.id, -1, 'AMBIL', 'Pengambilan barang via tombol konfirmasi remote/maket');
      refreshItems();
    }

    // Matikan semua LED
    await resetWarehouseState();
    showToast(`Barang "${itemName}" berhasil diambil! LED dimatikan dan stok diperbarui.`);
  };

  // Klik rak langsung di maket simulator
  const handleSelectRackFromMaket = async (item) => {
    await handleSearchItem(item);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors">
      {/* Toast Notifikasi Global */}
      {toastNotification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastNotification}</span>
        </div>
      )}

      {/* Navigasi Utama */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        syncStatus={syncStatus}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'maket' && (
          <MaketView
            state={warehouseState}
            items={items}
            onReset={handleReset}
            onConfirmPickup={handleConfirmPickup}
            onSelectRack={handleSelectRackFromMaket}
          />
        )}

        {currentView === 'remote' && (
          <RemoteView
            state={warehouseState}
            items={items}
            onSelectAisle={handleSelectAisle}
            onSearchItem={handleSearchItem}
            onReset={handleReset}
            onConfirmPickup={handleConfirmPickup}
            syncStatus={syncStatus}
          />
        )}

        {currentView === 'inventory' && (
          <InventoryView
            items={items}
            onItemsUpdated={refreshItems}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Smart Warehouse Prototype • 12 Rak (3 Lajur x 4 Rak) • ESP32 GPIO 5
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="hover:underline text-blue-600 dark:text-blue-400"
            >
              Pengaturan Database
            </button>
            <span>•</span>
            <button
              onClick={() => setIsQrOpen(true)}
              className="hover:underline text-blue-600 dark:text-blue-400"
            >
              Buka di HP
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentStatus={syncStatus}
      />

      <QrShareModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  );
}
