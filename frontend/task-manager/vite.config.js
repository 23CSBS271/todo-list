import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const postcssThemePlugin = require('./postcss-theme-plugin.cjs')



// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [postcssThemePlugin()],
    },
  },
  plugins: [react(), tailwindcss()],
})
