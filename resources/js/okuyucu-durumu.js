import { okuyucuDurumunuOku, okumaEngeli } from './kalibrasyon-durumu';

export function ortakDurumuGoster() {
  const durum = okuyucuDurumunuOku();
  const engel = okumaEngeli(durum, 1);
  const surum = durum.aktifKalibrasyon?.surum;
  document.querySelectorAll('[data-kalibrasyon-baslik]').forEach((oge) => {
    oge.textContent = engel ? 'Doğrulanmış okuma ayarı yok' : 'Yerleşik okuma ayarı etkin';
  });
  document.querySelectorAll('[data-kalibrasyon-aciklama]').forEach((oge) => {
    const aday = durum.aday ? ` ${durum.aday.ad} (${durum.aday.sayfaSayisi} sayfa) yalnız önizleme olarak açıldı.` : '';
    oge.textContent = engel
      ? engel
      : `Sürüm ${surum}. Tüm test okumaları, taranmış cevap kâğıtlarında ölçülen ortak işaret eşikleriyle yapılır.${aday} Yüklenen kalibrasyon formu bu ayarı değiştirmez.`;
  });
  document.querySelectorAll('[data-kalibrasyon-etiket]').forEach((oge) => {
    oge.textContent = engel ? 'Doğrulama bekleniyor' : 'Etkin';
    oge.classList.toggle('turuncu', Boolean(engel));
    oge.classList.toggle('yesil', !engel);
  });
  document.querySelectorAll('[data-okuma-kosulu]').forEach((oge) => {
    oge.textContent = engel ?? `Okuyucu hazır. Okuma ayarı sürüm ${surum}; dosyalar bu cihazdan çıkmaz.`;
  });
}
