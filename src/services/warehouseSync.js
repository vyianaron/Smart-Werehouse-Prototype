/**
 * Unified Real-time Synchronization Engine untuk Smart Warehouse
 *
 * Mendukung 3 lapis sinkronisasi otomatis:
 * 1. Cloud Sync: Firebase Realtime Database di path "warehouse/state" (bisa diakses lintas jaringan/internet).
 * 2. LAN Wi-Fi Sync (Vite WebSocket): Menghubungkan HP & Laptop di Wi-Fi yang sama secara instan (< 50 ms)
 *    BAHKAN TANPA PERLU AKUN FIREBASE!
 * 3. Local BroadcastChannel: Komunikasi instan antar-tab/jendela di browser yang sama.
 */

import { ref, onValue, set } from 'firebase/database';
import { getFirebaseDb, isFirebaseConfigured } from '../config/firebase';
import { DEFAULT_STATE } from '../config/defaultData';

const LOCAL_STORAGE_STATE_KEY = 'smart_warehouse_shared_state';
const BROADCAST_CHANNEL_NAME = 'smart_warehouse_sync_channel';

// In-memory cache state saat ini
let currentState = { ...DEFAULT_STATE };
let connectionStatus = 'initializing'; // 'firebase' | 'lan-websocket' | 'local' | 'connecting' | 'error'
let listeners = new Set();
let statusListeners = new Set();

// 1. Inisialisasi Vite HMR WebSocket untuk sync HP <-> Laptop di jaringan Wi-Fi lokal
if (import.meta.hot) {
  import.meta.hot.on('warehouse:state-sync', (data) => {
    handleIncomingState(data, 'lan-websocket');
  });

  // Minta initial state dari server
  import.meta.hot.send('warehouse:request-initial', {});
}

// 2. Inisialisasi BroadcastChannel untuk komunikasi real-time antar-tab lokal
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        handleIncomingState(event.data.payload, 'local-broadcast');
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel tidak didukung di lingkungan ini:', e);
}

// 3. Listener untuk storage event (fallback tab)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === LOCAL_STORAGE_STATE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        handleIncomingState(parsed, 'local-storage');
      } catch (err) {}
    }
  });
}

// Queue dan lock penulisan
let writeQueue = Promise.resolve();

/**
 * Cek apakah dua objek state memiliki nilai logika yang sama
 */
function isStateIdentical(a, b) {
  if (!a || !b) return false;
  return (
    Number(a.lajur) === Number(b.lajur) &&
    Number(a.target) === Number(b.target) &&
    String(a.nama || '').trim().toLowerCase() === String(b.nama || '').trim().toLowerCase()
  );
}

/**
 * Handle state yang masuk dari Firebase, LAN WebSocket, atau Tab Lokal
 */
function handleIncomingState(incoming, source = 'unknown') {
  if (!incoming || typeof incoming !== 'object') return;

  const sanitized = {
    lajur: Number(incoming.lajur ?? 0),
    target: Number(incoming.target ?? -1),
    nama: String(incoming.nama || ''),
    ts: Number(incoming.ts || Date.now()),
    source: source,
  };

  // Jangan trigger listener jika nilainya identik dan timestamp lebih lama
  if (isStateIdentical(currentState, sanitized) && sanitized.ts <= currentState.ts) {
    return;
  }

  currentState = sanitized;

  // Simpan ke localStorage lokal agar persist
  try {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(sanitized));
  } catch (e) {}

  // Beritahu semua subscriber
  notifySubscribers();
}

/**
 * Beritahu subscriber bahwa state berubah
 */
function notifySubscribers() {
  const stateCopy = { ...currentState };
  listeners.forEach((callback) => {
    try {
      callback(stateCopy);
    } catch (err) {
      console.error('Error di subscriber listener:', err);
    }
  });
}

/**
 * Beritahu subscriber tentang perubahan status koneksi
 */
function notifyStatus(status, message = '') {
  connectionStatus = status;
  statusListeners.forEach((callback) => {
    try {
      callback({
        status,
        message,
        isFirebase: status === 'firebase',
        isLan: status === 'lan-websocket',
      });
    } catch (err) {
      console.error('Error di status listener:', err);
    }
  });
}

// Inisialisasi Firebase listener
let firebaseUnsubscribe = null;

function setupFirebaseSync() {
  if (!isFirebaseConfigured()) {
    if (import.meta.hot) {
      notifyStatus('lan-websocket', 'Tersinkron Jaringan Lokal Wi-Fi (HP & Laptop Langsung)');
    } else {
      notifyStatus('local', 'Mode Lokal Aktif (Belum menghubungkan Firebase)');
    }
    return;
  }

  const db = getFirebaseDb();
  if (!db) {
    notifyStatus('local', 'Gagal memuat Firebase DB, menggunakan Sinkronisasi Lokal');
    return;
  }

  notifyStatus('connecting', 'Menghubungkan ke Firebase Realtime Database...');

  try {
    const warehouseRef = ref(db, 'warehouse/state');

    firebaseUnsubscribe = onValue(
      warehouseRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          handleIncomingState(data, 'firebase');
        } else {
          set(warehouseRef, DEFAULT_STATE).catch(console.error);
        }
        notifyStatus('firebase', 'Tersinkron Realtime Cloud (Firebase)');
      },
      (error) => {
        console.error('Firebase Realtime error:', error);
        notifyStatus('lan-websocket', `Firebase offline: ${error.message}. Menggunakan Sinkronisasi Lokal Wi-Fi.`);
      }
    );
  } catch (err) {
    console.error('Error saat setup Firebase listener:', err);
    notifyStatus('lan-websocket', 'Menggunakan Sinkronisasi Lokal Wi-Fi.');
  }
}

// Muat state awal dari localStorage jika ada
try {
  const cached = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    currentState = {
      lajur: Number(parsed.lajur ?? 0),
      target: Number(parsed.target ?? -1),
      nama: String(parsed.nama || ''),
      ts: Number(parsed.ts || Date.now()),
    };
  }
} catch (e) {}

// Jalankan setup koneksi
setupFirebaseSync();

/**
 * PUBLIC API: Subscribe perubahan state
 */
export function subscribeWarehouseState(stateCallback, statusCallback) {
  if (typeof stateCallback === 'function') {
    listeners.add(stateCallback);
    stateCallback({ ...currentState });
  }

  if (typeof statusCallback === 'function') {
    statusListeners.add(statusCallback);
    statusCallback({
      status: connectionStatus,
      isFirebase: connectionStatus === 'firebase',
      isLan: connectionStatus === 'lan-websocket',
      message:
        connectionStatus === 'firebase'
          ? 'Tersinkron Realtime Cloud (Firebase)'
          : connectionStatus === 'connecting'
          ? 'Menghubungkan ke Firebase...'
          : 'Tersinkron Jaringan Lokal Wi-Fi (HP & Laptop Langsung)',
    });
  }

  return () => {
    if (stateCallback) listeners.delete(stateCallback);
    if (statusCallback) statusListeners.delete(statusCallback);
  };
}

/**
 * PUBLIC API: Update state bersama
 * Menulis ke:
 * 1. Vite LAN WebSocket (mengubah layar laptop dari HP secara instan)
 * 2. Firebase Cloud Realtime Database (jika disetup)
 * 3. BroadcastChannel lokal & localStorage
 */
export function pushWarehouseState(partialState) {
  writeQueue = writeQueue.then(async () => {
    const nextState = {
      lajur: partialState.lajur !== undefined ? Number(partialState.lajur) : currentState.lajur,
      target: partialState.target !== undefined ? Number(partialState.target) : currentState.target,
      nama: partialState.nama !== undefined ? String(partialState.nama) : currentState.nama,
      ts: Date.now(),
    };

    // Aturan: Jangan menulis ulang jika data sama
    if (isStateIdentical(currentState, nextState)) {
      return currentState;
    }

    // 1. Update in-memory & notify locally
    currentState = { ...nextState };
    try {
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(currentState));
    } catch (e) {}

    notifySubscribers();

    // 2. Broadcast ke Laptop/HP via Vite LAN WebSocket
    if (import.meta.hot) {
      try {
        import.meta.hot.send('warehouse:client-update', currentState);
      } catch (err) {
        console.warn('Gagal kirim via LAN WebSocket:', err);
      }
    }

    // Kirim juga via REST API lokal /api/warehouse/state sebagai fallback
    try {
      fetch('/api/warehouse/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      }).catch(() => {});
    } catch (e) {}

    // 3. Broadcast ke tab lokal lain via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: 'STATE_UPDATE',
          payload: currentState,
        });
      } catch (err) {}
    }

    // 4. Tulis ke Firebase Realtime Database jika aktif
    if (isFirebaseConfigured()) {
      const db = getFirebaseDb();
      if (db) {
        try {
          const warehouseRef = ref(db, 'warehouse/state');
          await set(warehouseRef, {
            lajur: currentState.lajur,
            target: currentState.target,
            nama: currentState.nama,
            ts: currentState.ts,
          });
        } catch (err) {
          console.error('Gagal menulis ke Firebase:', err);
        }
      }
    }

    return currentState;
  });

  return writeQueue;
}

/**
 * PUBLIC API: Reset state (semua LED mati)
 */
export function resetWarehouseState() {
  return pushWarehouseState({
    lajur: 0,
    target: -1,
    nama: '',
  });
}

/**
 * PUBLIC API: Trigger re-koneksi Firebase
 */
export function reconnectFirebase() {
  if (firebaseUnsubscribe) {
    try {
      firebaseUnsubscribe();
    } catch (e) {}
    firebaseUnsubscribe = null;
  }
  setupFirebaseSync();
}

/**
 * Ambil snapshot state saat ini
 */
export function getCurrentState() {
  return { ...currentState };
}
