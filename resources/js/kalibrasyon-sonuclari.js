import { ornekSonuclar, durumlar, sonucOzeti } from './kalibrasyon';
import { dosyaIndir } from './ortak';

export function sonuclariGoster(filtre = 'tumu') {
  const ozet = sonucOzeti(ornekSonuclar);
  const kartlar = [['Örnek kalibrasyon satırı', ozet.toplam], ['Örnek kontrol gereken', ozet.kontrol], ['Örnek boş işaret', ozet.bos]];
  document.querySelector('#sonuc-ozet').replaceChildren(...kartlar.map(([baslik, deger]) => {
    const kart = document.createElement('div');
    kart.className = 'kart';
    const etiket = document.createElement('span');
    etiket.textContent = baslik;
    const sayi = document.createElement('strong');
    sayi.textContent = deger;
    kart.append(etiket, sayi);
    return kart;
  }));
  const satirlar = ornekSonuclar.filter((satir) => filtre === 'tumu' || (filtre === 'bos' ? !satir.secimler.length : satir.durum === filtre));
  document.querySelector('#sonuc-satirlari').replaceChildren(...satirlar.map((sonuc) => {
    const satir = document.createElement('tr');
    const hucreler = Array.from({ length: 4 }, () => document.createElement('td'));
    hucreler[0].textContent = `K ${sonuc.satir}`;
    hucreler[1].textContent = sonuc.yonerge;
    if (sonuc.secimler.length) {
      sonuc.secimler.forEach((deger) => {
        const balon = document.createElement('span');
        balon.className = 'secim-balonu';
        balon.textContent = deger;
        hucreler[2].append(balon);
      });
    } else hucreler[2].textContent = 'İşaret yok';
    const durum = durumlar[sonuc.durum] ?? { etiket: 'Belirtilmemiş', renk: '' };
    const etiket = document.createElement('span');
    etiket.className = `etiket ${durum.renk}`;
    etiket.textContent = durum.etiket;
    hucreler[3].append(etiket);
    satir.append(...hucreler);
    return satir;
  }));
}

export function ornekVeriyiIndir() {
  const veri = {
    aciklama: 'Yalnızca arayüz tasarımına ait örnek veridir. Yüklenen PDF dosyalarından üretilmemiştir.',
    satirlar: ornekSonuclar.map((satir) => ({ satir: satir.satir, yonerge: satir.yonerge, ornekSecimler: satir.secimler, ornekDurum: durumlar[satir.durum].etiket })),
  };
  dosyaIndir('ornek-kalibrasyon-sonuclari.json', JSON.stringify(veri, null, 2), 'application/json');
}
