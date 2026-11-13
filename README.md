# Smart Warehouse Simulator & Remote (ESP32 Ready)

Prototipe sistem **Smart Warehouse** (Gudang Pintar) berbasis IoT berupa **Website Simulator Maket Fisik** dan **Aplikasi Remote Kontrol HP** yang tersinkronisasi secara *real-time* (latensi < 1 detik tanpa refresh).

Sistem ini dirancang agar siap digantikan oleh perangkat keras asli (**ESP32 + 12 LED WS2812B di GPIO 5**) tanpa mengubah logika bisnis sedikit pun.

---

## 📑 Daftar Isi
1. [Konsep & Arsitektur Sistem](#1-konsep--arsitektur-sistem)
2. [Struktur Folder](#2-struktur-folder)
3. [Panduan Instalasi & Menjalankan](#3-panduan-instalasi--menjalankan)
4. [Panduan Setup Firebase (Langkah Pemula)](#4-panduan-setup-firebase-langkah-pemula)
5. [Cara Menguji Sinkronisasi (Laptop & HP)](#5-cara-menguji-sinkronisasi-laptop--hp)
6. [Integrasi Hardware ESP32](#6-integrasi-hardware-esp32)
7. [Fitur Tambahan (Stok & Riwayat)](#7-fitur-tambahan-stok--riwayat)

---

## 1. Konsep & Arsitektur Sistem

### 📐 Tata Letak Gudang
Gudang mini terdiri dari **3 lajur** (baris) dan tiap lajur memiliki **4 rak**, total **12 rak** yang dipetakan ke **12 LED WS2812B**:
- **Lajur 1: Snack** (LED #0 – #3)
  - Rak 1: Chitato (LED #0)
  - Rak 2: Oreo (LED #1)
  - Rak 3: Malkist Roma (LED #2)
  - Rak 4: Taro (LED #3)
- **Lajur 2: Minuman** (LED #4 – #7)
  - Rak 1: Aqua (LED #4)
  - Rak 2: Teh Botol (LED #5)
  - Rak 3: Pocari (LED #6)
  - Rak 4: Susu Ultra (LED #7)
- **Lajur 3: Alat Tulis** (LED #8 – #11)
  - Rak 1: Buku Tulis (LED #8)
  - Rak 2: Penggaris (LED #9)
  - Rak 3: Spidol (LED #10)
  - Rak 4: Pulpen (LED #11)

### 🧮 Rumus Pemetaan LED
$$\text{LED} = (\text{lajur} - 1) \times 4 + (\text{rak} - 1)$$
*(Lajur 1–3, Rak 1–4 $\rightarrow$ Indeks LED 0–11)*

### 🔄 Perilaku Inti Lampu
| Aksi Pengguna | Perilaku LED | State Bersama |
|---|---|---|
| **Pilih Lajur** (Snack/Minuman/Alat tulis) | Seluruh 4 LED di lajur itu menyala **Biru Redup** | `{"lajur": 1..3, "target": -1, "nama": ""}` |
| **Cari Barang** (mis. *"malkist roma"*) | Lajur menyala **Biru Redup**, LED rak target **Berkedip Hijau Terang** | `{"lajur": 1..3, "target": 0..11, "nama": "..."}` |
| **Barang Tidak Ditemukan** | Muncul pesan error jelas, **LED tidak berubah** | State tetap sama |
| **Reset / Matikan** | Seluruh 12 LED mati | `{"lajur": 0, "target": -1, "nama": ""}` |
| **Barang Sudah Diambil** | Stok berkurang 1, tercatat di riwayat, seluruh LED mati | State kembali ke reset |

### 🌐 Format State Bersama
Satu dokumen state di path `warehouse/state`:
```json
{
  "lajur": 1,
  "target": 2,
  "nama": "Malkist Roma",
  "ts": 1715600000000
}
```

---

## 2. Struktur Folder

```text
prototype/
├── index.html                   # HTML Entry point
├── package.json                 # Dependency React, Tailwind, Firebase, Lucide
├── vite.config.js               # Konfigurasi server LAN (host: true)
├── tailwind.config.js           # Animasi glow & efek LED
├── postcss.config.js
├── src/
│   ├── main.jsx                 # Bootstrapping React 18
│   ├── App.jsx                  # State management & router tampilan
│   ├── index.css                # Style global & keyframes animasi LED
│   ├── config/
│   │   ├── defaultData.js       # 12 barang bawaan & konfigurasi lajur
│   │   └── firebase.js          # Inisialisasi Firebase & helper storage
│   ├── services/
│   │   ├── warehouseSync.js     # Unified Sync Engine (Firebase + Local BroadcastChannel)
│   │   └── inventoryStorage.js  # CRUD barang, counter stok & riwayat transaksi
│   ├── components/
│   │   ├── Navbar.jsx           # Header, view switcher, dark mode & status
│   │   ├── MaketView.jsx        # Visualisasi maket 3x4 rak & simulator LED
│   │   ├── RemoteView.jsx       # Panel kontrol HP: pencarian, tombol lajur, quick chips
│   │   ├── InventoryView.jsx    # Halaman kelola barang, stok & log keluar-masuk
│   │   ├── LedIndicator.jsx     # Komponen fisik LED (mati/biru redup/hijau kedip)
│   │   ├── ConfigModal.jsx      # Modal setup Firebase interaktif (tanpa rebuild)
│   │   └── QrShareModal.jsx     # Modal QR code untuk scan & buka di HP
│   └── utils/
│       └── warehouseHelpers.js  # Rumus LED & algoritma pencarian
├── arduino/
│   └── smart_warehouse_esp32.ino # Firmware ESP32 lengkap (NeoPixel + HTTP REST)
└── README.md                    # Dokumentasi lengkap
```

---

## 3. Panduan Instalasi & Menjalankan

### Kebutuhan Sistem
- **Node.js** v18+ (disarankan v20+)
- **NPM** atau **Bun** / **Yarn**

### Langkah Cepat:
1. Masuk ke direktori proyek:
   ```bash
   cd "prototype"
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```

3. Buka di browser:
   - Tampilan Maket (Laptop): `http://localhost:5173/?view=maket`
   - Tampilan Remote (HP): `http://localhost:5173/?view=remote`

> **Catatan:** Vite telah dikonfigurasi dengan `host: true`, sehingga otomatis terbuka ke jaringan lokal WiFi Anda (misal `http://192.168.1.50:5173`).

---

## 4. Panduan Setup Firebase (Langkah Pemula)

Aplikasi memiliki **Fallback Otomatis**: Jika Anda belum memasukkan Firebase, aplikasi tetap berjalan 100% menggunakan **Mode Lokal (BroadcastChannel)** sehingga dua tab browser (misal Maket di kiri dan Remote di kanan) langsung tersinkronisasi instan!

Untuk menghubungkan sinkronisasi **Cloud antar perangkat (HP & Laptop beda jaringan atau dengan ESP32)**, ikuti langkah mudah ini:

1. Kunjungi [Firebase Console](https://console.firebase.google.com/) dan login dengan akun Google.
2. Klik **Add project** (Tambah project) $\rightarrow$ Beri nama proyek (misal `smart-warehouse`) $\rightarrow$ Selesaikan pembuatan.
3. Di bilah menu kiri, pilih **Build** $\rightarrow$ **Realtime Database**:
   - Klik tombol **Create Database**.
   - Pilih lokasi database (default `United States` atau `Singapore`).
   - Pilih **Start in test mode** (agar izin baca & tulis terbuka untuk pengujian prototipe) $\rightarrow$ Klik **Enable**.
4. Daftarkan Web App:
   - Klik ikon **Settings (Gerigi)** di kiri atas $\rightarrow$ **Project settings**.
   - Di tab **General**, gulir ke bawah ke bagian **Your apps** $\rightarrow$ Klik ikon Web (`</>`).
   - Beri nama app (misal `Warehouse Web`) $\rightarrow$ Klik **Register app**.
   - Salin objek `const firebaseConfig = { ... }`.
5. Masukkan ke Aplikasi:
   - Di aplikasi web Smart Warehouse, klik tombol **Status Koneksi** / ikon database di Navbar atas.
   - Klik **Tempel Objek JSON Firebase Config Sekaligus** dan tempel konfigurasi tadi.
   - Klik **Simpan & Hubungkan**.
   - Indikator status akan langsung berubah menjadi **🟢 Firebase Online**!

---

## 5. Cara Menguji Sinkronisasi (Laptop & HP)

### Opsi A: Uji Cepat di 1 Komputer (Split Screen / 2 Tab)
1. Buka tab 1 di browser: `http://localhost:5173/?view=maket` (sebagai Layar Maket).
2. Buka tab 2 di jendela baru: `http://localhost:5173/?view=remote` (sebagai Remote HP).
3. Letakkan kedua jendela bersisian.
4. Di tab Remote, klik tombol **Lajur 1: Snack** $\rightarrow$ Perhatikan di tab Maket seluruh 4 rak di Lajur 1 seketika menyala **Biru Redup** dalam hitungan milidetik!
5. Ketik *"malkist roma"* di kolom pencarian Remote lalu klik **Cari** $\rightarrow$ Perhatikan LED #2 di Rak 3 seketika **Berkedip Hijau Terang**!

### Opsi B: Uji Nyata Laptop (Maket) dan HP Asli (Remote)
1. Pastikan Laptop dan HP terhubung ke **jaringan Wi-Fi yang sama** (atau HP menyalakan Personal Hotspot dan Laptop terhubung ke hotspot tersebut).
2. Di laptop, klik tombol **QR Code** di Navbar kanan atas.
3. Buka kamera di HP Anda dan scan QR Code yang muncul di layar.
4. Tampilan Remote akan terbuka langsung di layar HP.
5. Tekan tombol lajur atau cari barang dari HP Anda $\rightarrow$ Maket di laptop akan merespons langsung **tanpa refresh halaman (< 1 detik)**!

---

## 6. Integrasi Hardware ESP32

Saat prototipe hardware siap dipasang, Anda dapat langsung menghubungkan ESP32 tanpa mengubah kode simulator!

### Skema Rangkaian Wiring
- **Pin 5V / VIN** ESP32 $\rightarrow$ Jalur 5V Strip WS2812B
- **Pin GND** ESP32 $\rightarrow$ Jalur GND Strip WS2812B
- **Pin GPIO 5** ESP32 $\rightarrow$ Jalur DIN (Data In) Strip WS2812B

### Endpoint REST API Firebase
ESP32 membaca state yang sama via REST GET endpoint native Firebase:
```text
GET https://<DATABASE_NAME>.firebaseio.com/warehouse/state.json
```
Respons JSON:
```json
{"lajur": 1, "target": 2, "nama": "Malkist Roma", "ts": 1715600000000}
```

### Cara Membaca & Memetakan Warna di ESP32
File kode siap pakai tersedia di folder [arduino/smart_warehouse_esp32.ino](file:///Users/vian/kuliah/aplication%20project/prototype/arduino/smart_warehouse_esp32.ino):
1. ESP32 melakukan HTTP GET polling setiap **400 ms** (non-blocking menggunakan `millis()`).
2. Logika pewarnaan 12 LED:
   - Hitung lajur LED ke-$i$: `int ledLajur = (i / 4) + 1;`
   - Jika `i == target`: Berkedip **Hijau Terang** (`RGB: 0, 255, 0`) dengan interval 250ms ON / 250ms OFF.
   - Jika `ledLajur == lajur`: Menyala **Biru Redup** (`RGB: 0, 15, 60`).
   - Selain itu: Lampu mati (`RGB: 0, 0, 0`).

---

## 7. Fitur Tambahan (Stok & Riwayat)

1. **Halaman Kelola Barang (CRUD):**
   - Tambah barang baru dengan menentukan nama, lajur (1–3), rak (1–4), dan stok awal.
   - Sistem otomatis menghitung alamat nomor LED (`calculateLed`).
   - Ubah atau hapus data barang sewaktu-waktu.
2. **Penghitung Stok & Tombol Cepat (+ / -):**
   - Tambah dan kurangi stok barang langsung dari kartu barang.
3. **Tombol "Konfirmasi Barang Sudah Diambil":**
   - Muncul saat ada barang yang sedang dicari/disorot.
   - Mengurangi stok barang sebanyak 1 secara otomatis.
   - Mematikan seluruh LED.
   - Menambahkan catatan ke log riwayat keluar-masuk.
4. **Log Riwayat Keluar-Masuk (Audit Trail):**
   - Mencatat waktu transaksi, tipe aktivitas, nama barang, jumlah perubahan, dan sisa stok barang.
