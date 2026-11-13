/**
 * Konfigurasi & Inisialisasi Firebase Realtime Database
 * Mendukung konfigurasi via localStorage (diinput dari UI) atau file .env
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const STORAGE_KEY = 'smart_warehouse_firebase_config';

/**
 * Mendapatkan konfigurasi Firebase yang tersimpan
 */
export function getSavedFirebaseConfig() {
  // Cek localStorage terlebih dahulu
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.databaseURL) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca config Firebase dari localStorage:', e);
  }

  // Fallback ke import.meta.env jika ada
  if (import.meta.env?.VITE_FIREBASE_API_KEY && import.meta.env?.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

/**
 * Menyimpan konfigurasi Firebase ke localStorage
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reset instance app agar rebuild dengan config baru
    return true;
  } catch (e) {
    console.error('Gagal menyimpan config Firebase:', e);
    return false;
  }
}

/**
 * Menghapus konfigurasi Firebase (kembali ke mode lokal)
 */
export function clearFirebaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

let firebaseApp = null;
let databaseInstance = null;

/**
 * Inisialisasi Firebase App & Realtime Database
 */
export function getFirebaseDb() {
  const config = getSavedFirebaseConfig();
  if (!config) return null;

  try {
    if (!firebaseApp) {
      const apps = getApps();
      firebaseApp = apps.length > 0 ? getApp() : initializeApp(config);
    }
    if (!databaseInstance) {
      databaseInstance = getDatabase(firebaseApp);
    }
    return databaseInstance;
  } catch (err) {
    console.error('Error inisialisasi Firebase:', err);
    return null;
  }
}

export function isFirebaseConfigured() {
  const cfg = getSavedFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.databaseURL);
}
