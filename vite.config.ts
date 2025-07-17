import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: match your GitHub repo name
const repoName = 'Audio-Visual-Ambientalizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,   // ensures assets load on GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
