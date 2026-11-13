/**
 * Smart Warehouse Prototype - ESP32 Hardware Firmware
 *
 * Mengendalikan 12 LED WS2812B di GPIO 5 berdasarkan state real-time dari
 * Firebase Realtime Database / REST API.
 *
 * Komponen & Pustaka:
 * - Board: ESP32 Dev Module
 * - LED Strip: WS2812B (12 LED) terhubung ke GPIO 5
 * - Library Arduino IDE:
 *   1. Adafruit NeoPixel (oleh Adafruit)
 *   2. ArduinoJson (oleh Benoit Blanchon - v6 atau v7)
 *   3. WiFi.h & HTTPClient.h (Bawaan ESP32)
 *
 * Logika Pemetaan LED:
 * - led = (lajur - 1) * 4 + (rak - 1)   (Lajur 1-3, Rak 1-4, LED 0-11)
 * - Biru Redup = Seluruh LED di lajur yang aktif (RGB: 0, 15, 60)
 * - Hijau Berkedip = LED rak target barang (RGB: 0, 255, 0 / interval 250ms)
 * - Mati = LED di luar lajur / saat reset (RGB: 0, 0, 0)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

// ================= KONFIGURASI WIFI & FIREBASE =================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Masukkan URL Firebase Realtime Database Anda (akhiri dengan /warehouse/state.json)
// Contoh: "https://smart-warehouse-default-rtdb.firebaseio.com/warehouse/state.json"
const char* FIREBASE_REST_URL = "https://NAMA_PROJECT_ANDA-default-rtdb.firebaseio.com/warehouse/state.json";

// ================= KONFIGURASI HARDWARE LED =================
#define LED_PIN      5     // GPIO 5 ESP32 terhubung ke DIN WS2812B
#define NUM_LEDS     12    // 12 LED (3 lajur x 4 rak)

// Inisialisasi objek strip NeoPixel
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

// ================= STATE GUDANG =================
struct WarehouseState {
  int lajur;      // 0 = semua mati, 1-3 = lajur aktif
  int target;     // -1 = tidak ada target, 0-11 = nomor LED berkedip
  String nama;    // nama barang
  long long ts;   // timestamp
};

WarehouseState currentState = { 0, -1, "", 0 };

// Pewaktu (Non-blocking timer)
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 400; // Polling data tiap 400 ms (< 1 detik)

unsigned long lastBlinkToggle = 0;
bool blinkState = false;
const unsigned long BLINK_INTERVAL = 250; // Frekuensi kedip 250ms ON / 250ms OFF

// ================= FUNCTION PROTOTYPES =================
void connectWiFi();
void fetchWarehouseState();
void updateLedHardware();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==========================================");
  Serial.println("  Smart Warehouse - ESP32 Firmware Starting");
  Serial.println("==========================================");

  // Inisialisasi LED Strip
  strip.begin();
  strip.setBrightness(180); // Kecerahan umum (0 - 255)
  strip.clear();
  strip.show();

  // Animasi start-up (LED test menyala bergantian)
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(0, 40, 100)); // Tes biru
    strip.show();
    delay(50);
  }
  delay(200);
  strip.clear();
  strip.show();

  // Koneksi WiFi
  connectWiFi();
}

void loop() {
  // Cek dan pulihkan koneksi WiFi jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Koneksi terputus, mencoba menyambung ulang...");
    connectWiFi();
  }

  unsigned long currentMillis = millis();

  // 1. Polling State dari Firebase setiap 400 ms
  if (currentMillis - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = currentMillis;
    fetchWarehouseState();
  }

  // 2. Toggle Status Berkedip (Blink) untuk Target LED setiap 250 ms
  if (currentMillis - lastBlinkToggle >= BLINK_INTERVAL) {
    lastBlinkToggle = currentMillis;
    blinkState = !blinkState;
  }

  // 3. Render Warna ke 12 LED Fisik
  updateLedHardware();
}

/**
 * Menyambungkan ESP32 ke jaringan WiFi
 */
void connectWiFi() {
  Serial.printf("[WIFI] Menghubungkan ke: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Berhasil terhubung!");
    Serial.print("[WIFI] IP ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Gagal terhubung! Periksa SSID & Password.");
  }
}

/**
 * Membaca State dari Firebase Realtime Database via REST API
 */
void fetchWarehouseState() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Mengabaikan verifikasi sertifikat SSL untuk Firebase REST

  HTTPClient http;
  if (!http.begin(client, FIREBASE_REST_URL)) {
    Serial.println("[HTTP] Gagal inisialisasi koneksi");
    return;
  }

  http.setTimeout(2500); // Timeout 2.5 detik
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    // Parse JSON menggunakan ArduinoJson
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      int newLajur  = doc["lajur"] | 0;
      int newTarget = doc["target"] | -1;
      const char* newNama = doc["nama"] | "";

      // Deteksi perubahan state
      if (newLajur != currentState.lajur || newTarget != currentState.target) {
        Serial.printf("[STATE UPDATE] Lajur: %d | Target LED: %d | Nama: %s\n",
                      newLajur, newTarget, newNama);
      }

      currentState.lajur  = newLajur;
      currentState.target = newTarget;
      currentState.nama   = String(newNama);
    } else {
      Serial.printf("[JSON] Gagal parse payload: %s\n", error.c_str());
    }
  } else {
    // Tampilkan error jika bukan 200 OK
    if (httpCode > 0) {
      Serial.printf("[HTTP] Respons code: %d\n", httpCode);
    }
  }

  http.end();
}

/**
 * Memetakan state ke 12 LED WS2812B
 * Rumus lajur LED ke-i: ledLajur = (i / 4) + 1
 */
void updateLedHardware() {
  for (int i = 0; i < NUM_LEDS; i++) {
    // Hitung nomor lajur untuk LED i (0-3 = Lajur 1, 4-7 = Lajur 2, 8-11 = Lajur 3)
    int ledLajur = (i / 4) + 1;

    // KONDISI 1: Ini adalah LED target barang yang dicari
    if (i == currentState.target) {
      if (blinkState) {
        // Hijau terang saat ON
        strip.setPixelColor(i, strip.Color(0, 255, 0));
      } else {
        // Redup / Mati saat OFF untuk efek berkedip mencolok
        strip.setPixelColor(i, strip.Color(0, 0, 0));
      }
    }
    // KONDISI 2: LED ini berada di lajur yang aktif
    else if (currentState.lajur > 0 && ledLajur == currentState.lajur) {
      // Biru redup (R: 0, G: 15, B: 60)
      strip.setPixelColor(i, strip.Color(0, 15, 60));
    }
    // KONDISI 3: Semua kondisi lain (mati)
    else {
      strip.setPixelColor(i, strip.Color(0, 0, 0));
    }
  }

  strip.show();
}
