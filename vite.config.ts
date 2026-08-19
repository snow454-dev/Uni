import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev
export default defineConfig({
  plugins: [react()],
  base: '/Uni/', // 👈 ここにリポジトリ名を追加します
})
