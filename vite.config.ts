import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
        electron([
            {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        rollupOptions: {
                            external: ['@prisma/client', '.prisma/client'],
                        },
                    },
                },
            },
            {
                entry: 'electron/preload.ts',
                onstart(options) {
                    options.reload()
                },
            },
        ]),
        renderer(),
    ],
})
