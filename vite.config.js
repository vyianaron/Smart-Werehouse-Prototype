import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In-memory shared state di server Vite (untuk sync lokal HP-Laptop & REST API ESP32)
let localWarehouseState = {
  lajur: 0,
  target: -1,
  nama: '',
  ts: Date.now(),
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'smart-warehouse-lan-sync',
      configureServer(server) {
        // 1. REST API endpoint: /api/warehouse/state (bisa dibaca langsung oleh ESP32 & HP)
        server.middlewares.use('/api/warehouse/state', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(localWarehouseState));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                localWarehouseState = {
                  lajur: Number(parsed.lajur ?? 0),
                  target: Number(parsed.target ?? -1),
                  nama: String(parsed.nama || ''),
                  ts: Date.now(),
                };

                // Broadcast ke semua browser (Laptop & HP) via Vite WebSocket
                server.ws.send({
                  type: 'custom',
                  event: 'warehouse:state-sync',
                  data: localWarehouseState,
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, state: localWarehouseState }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end();
        });

        // 2. Vite WebSocket listener untuk komunikasi instan HP <-> Laptop
        server.ws.on('warehouse:client-update', (data) => {
          if (data && typeof data === 'object') {
            localWarehouseState = {
              lajur: Number(data.lajur ?? 0),
              target: Number(data.target ?? -1),
              nama: String(data.nama || ''),
              ts: Date.now(),
            };

            // Broadcast ke semua browser terhubung
            server.ws.send({
              type: 'custom',
              event: 'warehouse:state-sync',
              data: localWarehouseState,
            });
          }
        });

        // Kirim initial state saat klien baru terhubung
        server.ws.on('warehouse:request-initial', (data, client) => {
          client.send({
            type: 'custom',
            event: 'warehouse:state-sync',
            data: localWarehouseState,
          });
        });
      },
    },
  ],
  server: {
    host: true, // Izinkan akses dari jaringan lokal (HP / perangkat lain di Wi-Fi yang sama)
    port: 5173,
  },
})
