import { daireKoyulugu, dikdortgenKoyulugu, halkaKoyulugu, koyulukTablosu } from './goruntu.js';
import { hizalamaKur, koseleriBul } from './hizalama.js';

export const taninmamaNedenleri = {
  kose: 'Dört köşe işareti bulunamadı',
  oran: 'Köşe işaretleri form ölçüsüne uymuyor',
  serit: 'Form numarası şeridi okunamadı',
  duzen: 'Sayfa düzeni cevap kâğıdına benzemiyor',
  olcum: 'Ölçüm türü başlıktan okunamadı',
};

export function alanKarari(doluluklar, secenekler, parametreler) {
  const sirali = doluluklar.map((deger, sira) => ({ deger, sira })).sort((a, b) => b.deger - a.deger);
  const enDolu = sirali[0].deger;
  const sonraki = sirali.length > 1 ? sirali[1].deger : 0;
  if (enDolu < parametreler.isaretEsigi) return { durum: 'bos', deger: null };
  if (sonraki >= parametreler.isaretEsigi && sonraki >= parametreler.ciftIsaretOrani * enDolu) return { durum: 'cift', deger: null };
  return { durum: 'isaretli', deger: secenekler[sirali[0].sira].deger, silik: enDolu < parametreler.silikIsaretEsigi, ikinciIz: sonraki >= parametreler.isaretEsigi };
}

function seritOku(koyuluk, donusum, olcek, serit, parametreler) {
  const bitler = [];
  for (let sira = 0; sira < serit.hucreSayisi; sira++) {
    const [x, y] = donusum([serit.u0 + sira * serit.adim, serit.v]);
    const yari = serit.yariKenar * olcek;
    const oran = dikdortgenKoyulugu(koyuluk, x - yari, y - yari, x + yari, y + yari);
    if (oran > parametreler.seritBosEsigi && oran < parametreler.seritDoluEsigi) return null;
    bitler.push(oran >= parametreler.seritDoluEsigi ? 1 : 0);
  }
  if (bitler[0] !== 1) return null;
  return { sayfaNo: bitler[1] + 1, formNo: bitler.slice(2).reduce((toplam, bit) => toplam * 2 + bit, 0) };
}

function halkaUyumu(gri, donusum, olcek, alanlar, sablon) {
  let toplam = 0;
  let adet = 0;
  for (const alan of alanlar) {
    for (const secenek of alan.secenekler) {
      const [x, y] = donusum([secenek.u, secenek.v]);
      toplam += halkaKoyulugu(gri, x, y, (sablon.balonYaricapi - sablon.halka.icPay) * olcek, (sablon.balonYaricapi + sablon.halka.disPay) * olcek);
      adet++;
    }
  }
  return adet ? toplam / adet : 0;
}

function olcumBul(koyuluk, donusum, baslik) {
  const profil = [];
  for (let u = baslik.u0; u < baslik.u1; u++) {
    const [x0, y0] = donusum([u, baslik.v0]);
    const [x1, y1] = donusum([u + 1, baslik.v1]);
    profil.push(dikdortgenKoyulugu(koyuluk, x0, y0, x1, y1));
  }
  const pencere = baslik.pencere;
  let toplam = 0;
  for (let sira = 0; sira < profil.length; sira++) {
    toplam += profil[sira];
    if (sira >= pencere) toplam -= profil[sira - pencere];
    if (sira >= pencere - 1 && toplam / pencere > baslik.esik) {
      let bas = sira - pencere + 1;
      while (profil[bas] < baslik.esik / 2) bas++;
      const kenar = baslik.u0 + bas;
      const bulunan = baslik.turler.find((tur) => Math.abs(tur.solKenar - kenar) <= baslik.pay);
      return bulunan ? bulunan.olcum : null;
    }
  }
  return null;
}

export function sayfaOku(gri, sablon, parametreler) {
  const koyuluk = koyulukTablosu(gri);
  const koseler = koseleriBul(koyuluk, sablon);
  if (!koseler) return { taninan: false, neden: 'kose' };
  const hizalama = hizalamaKur(koseler, sablon);
  if (!hizalama) return { taninan: false, neden: 'oran' };
  let secilen = null;
  for (const yon of ['duz', 'ters']) {
    const donusum = hizalama[yon];
    const serit = seritOku(koyuluk, donusum, hizalama.olcek, sablon.serit, parametreler);
    if (!serit) continue;
    const alanlar = sablon.sayfalar[serit.sayfaNo];
    const uyum = halkaUyumu(gri, donusum, hizalama.olcek, alanlar, sablon);
    if (!secilen || uyum > secilen.uyum) secilen = { yon, donusum, serit, alanlar, uyum };
  }
  if (!secilen) return { taninan: false, neden: 'serit' };
  if (secilen.uyum < parametreler.halkaUyumEsigi) return { taninan: false, neden: 'duzen' };
  const icYaricap = sablon.balonYaricapi * sablon.olcumYaricapOrani * hizalama.olcek;
  const alanlar = {};
  for (const alan of secilen.alanlar) {
    const doluluk = alan.secenekler.map((secenek) => {
      const [x, y] = secilen.donusum([secenek.u, secenek.v]);
      return daireKoyulugu(gri, x, y, icYaricap);
    });
    alanlar[alan.ad] = { ...alanKarari(doluluk, alan.secenekler, parametreler), doluluk };
  }
  return {
    taninan: true,
    formNo: secilen.serit.formNo,
    sayfaNo: secilen.serit.sayfaNo,
    olcum: olcumBul(koyuluk, secilen.donusum, sablon.baslik),
    ters: secilen.yon === 'ters',
    donusum: secilen.donusum,
    alanlar,
  };
}
