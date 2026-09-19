import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const toolsDir = path.resolve(__dirname, 'tools');
  const input: Record<string, string> = {
    main: path.resolve(__dirname, 'index.html'),
  };

  if (fs.existsSync(toolsDir)) {
    const toolFiles = fs.readdirSync(toolsDir);
    for (const file of toolFiles) {
      if (file.endsWith('.html')) {
        const name = file.replace('.html', '');
        input[`tools/${name}`] = path.resolve(toolsDir, file);
      }
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input,
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
