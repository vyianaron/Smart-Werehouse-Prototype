/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      boxShadow: {
        'glow-blue': '0 0 20px 2px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 25px 5px rgba(34, 197, 94, 0.8)',
      }
    },
  },
  plugins: [],
}
