import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import isciAdresi from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = isciAdresi;

export async function pdfAc(dosya) {
  if (!dosya || !dosya.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Lütfen PDF biçiminde bir dosya seçin.');
  }
  if (dosya.size > 50 * 1024 * 1024) {
    throw new Error('Lütfen 50 MB veya daha küçük bir PDF seçin.');
  }
  const veri = new Uint8Array(await dosya.arrayBuffer());
  const baslik = new TextDecoder().decode(veri.slice(0, 1024));
  if (!baslik.includes('%PDF-')) throw new Error('Dosya geçerli bir PDF değil. Lütfen tarayıcınızdan yeniden PDF olarak kaydedin.');
  const gorev = getDocument({ data: veri, isEvalSupported: false, useSystemFonts: true, wasmUrl: `${import.meta.env.BASE_URL}pdf-cozuculeri/` });
  gorev.onPassword = () => { gorev.destroy(); };
  try {
    return await gorev.promise;
  } catch {
    await gorev.destroy();
    throw new Error('PDF açılamadı. Şifresiz ve sağlam bir PDF seçip yeniden deneyin.');
  }
}

export async function pdfSayfaCiz(belge, sayfaNo, tuval) {
  const sayfa = await belge.getPage(sayfaNo);
  const gorunum = sayfa.getViewport({ scale: 1.6 });
  tuval.width = gorunum.width;
  tuval.height = gorunum.height;
  await sayfa.render({ canvasContext: tuval.getContext('2d'), viewport: gorunum }).promise;
}

export async function pdfSayfaGri(belge, sayfaNo, genislik, tuval) {
  const sayfa = await belge.getPage(sayfaNo);
  const gorunum = sayfa.getViewport({ scale: genislik / sayfa.getViewport({ scale: 1 }).width });
  tuval.width = Math.round(gorunum.width);
  tuval.height = Math.round(gorunum.height);
  const baglam = tuval.getContext('2d', { willReadFrequently: true });
  await sayfa.render({ canvasContext: baglam, viewport: gorunum }).promise;
  const noktalar = baglam.getImageData(0, 0, tuval.width, tuval.height).data;
  const veri = new Uint8Array(tuval.width * tuval.height);
  for (let sira = 0; sira < veri.length; sira++) {
    veri[sira] = (noktalar[sira * 4] * 299 + noktalar[sira * 4 + 1] * 587 + noktalar[sira * 4 + 2] * 114) / 1000;
  }
  sayfa.cleanup();
  return { genislik: tuval.width, yukseklik: tuval.height, veri };
}

export function sayfaKucukResmi(tuval, genislik) {
  const kucuk = document.createElement('canvas');
  kucuk.width = genislik;
  kucuk.height = Math.round(tuval.height * genislik / tuval.width);
  kucuk.getContext('2d').drawImage(tuval, 0, 0, kucuk.width, kucuk.height);
  return kucuk.toDataURL('image/jpeg', 0.7);
}

export async function pdfKapat(belge) {
  if (belge) await belge.loadingTask.destroy();
}
