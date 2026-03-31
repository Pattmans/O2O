import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'o2o-marketing-dashboard' with your GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/o2o-marketing-dashboard/', // ← Change to your repo name
})
