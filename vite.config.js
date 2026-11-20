import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

const pdfCozuculeri = ['jbig2.wasm', 'jbig2_nowasm_fallback.js', 'openjpeg.wasm', 'openjpeg_nowasm_fallback.js', 'qcms_bg.wasm'];

function pdfCozuculeriniEkle() {
  return {
    name: 'pdf-cozuculeri',
    generateBundle() {
      for (const ad of pdfCozuculeri) {
        this.emitFile({ type: 'asset', fileName: `pdf-cozuculeri/${ad}`, source: readFileSync(`node_modules/pdfjs-dist/wasm/${ad}`) });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    laravel({ input: ['resources/js/uygulama.js'], refresh: true }),
    pdfCozuculeriniEkle(),
  ],
  server: {
    watch: { ignored: ['**/storage/framework/views/**'] },
  },
});
