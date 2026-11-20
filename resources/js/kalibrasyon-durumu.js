import { okumaProfili } from './okuma-profili.js';

const kayitAnahtari = 'optika.kalibrasyon-adayi.v1';

export function kalibrasyonAdayiniKaydet(aday, depo) {
  const kayit = { ad: String(aday.ad), sayfaSayisi: aday.sayfaSayisi };
  try { (depo ?? globalThis.localStorage).setItem(kayitAnahtari, JSON.stringify(kayit)); } catch { return false; }
  return true;
}

export function okuyucuDurumunuOku(depo) {
  let aday = null;
  try {
    const kayit = JSON.parse((depo ?? globalThis.localStorage).getItem(kayitAnahtari));
    if (typeof kayit?.ad === 'string' && Number.isSafeInteger(kayit.sayfaSayisi) && kayit.sayfaSayisi > 0) {
      aday = { ad: kayit.ad, sayfaSayisi: kayit.sayfaSayisi };
    }
  } catch { aday = null; }
  return { aday, aktifKalibrasyon: okumaProfili, motorHazir: true };
}

export function okumaEngeli({ aktifKalibrasyon, motorHazir }, dosyaSayisi = 0) {
  if (!aktifKalibrasyon?.dogrulandi || !aktifKalibrasyon?.surum || !aktifKalibrasyon?.parametreler || Object.keys(aktifKalibrasyon.parametreler).length === 0) {
    return 'Okuyucu ayarları henüz doğrulanmadı. Dosya ekleyebilir ve sayfalarını sayabilirsiniz; optik okuma başlatılamaz.';
  }
  if (!motorHazir) return 'Optik okuma henüz kullanıma hazır değil.';
  if (dosyaSayisi < 1) return 'Okumaya başlamak için en az bir geçerli test PDF’si ekleyin.';
  return null;
}
