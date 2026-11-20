import { sonucSurumu } from './okuma-sonucu.js';

const kayitAnahtari = 'optika.okuma-sonucu.v1';

export function sonucuKaydet(sonuc, depo) {
  const hedef = depo ?? globalThis.localStorage;
  try {
    hedef.setItem(kayitAnahtari, JSON.stringify(sonuc));
    return true;
  } catch {
    try {
      hedef.setItem(kayitAnahtari, JSON.stringify({ ...sonuc, ayrilanlar: sonuc.ayrilanlar.map((kayit) => ({ ...kayit, resim: null })) }));
      return true;
    } catch { return false; }
  }
}

export function sonucuOku(depo) {
  try {
    const sonuc = JSON.parse((depo ?? globalThis.localStorage).getItem(kayitAnahtari));
    if (sonuc?.surum !== sonucSurumu || !Array.isArray(sonuc.ogrenciler) || !Array.isArray(sonuc.tablo?.satirlar)) return null;
    return sonuc;
  } catch { return null; }
}

export function sonucuSil(depo) {
  try { (depo ?? globalThis.localStorage).removeItem(kayitAnahtari); } catch { return false; }
  return true;
}
