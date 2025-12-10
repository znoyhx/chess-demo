/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wood-light': '#f0d5b6', // 棋子底色
        'wood-dark': '#DEB887',  // 棋盘底色
        'ink-black': '#1a1a1a',  // 黑棋/文字
        'china-red': '#c41e3a',  // 红棋
      },
      boxShadow: {
        'piece': '2px 2px 4px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}