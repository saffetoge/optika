import { formSablonu } from '../../../resources/js/form-sablonu.js';

export function sayfaCiz({ sayfaNo, formNo, olcum = null, isaretler = {}, genislik = 1190, koseler = true, halkalar = true }) {
  const yukseklik = Math.round(genislik * 1684 / 1190);
  const veri = new Uint8Array(genislik * yukseklik).fill(255);
  const olcek = genislik * 1017 / 1190 / formSablonu.genislik;
  const kaymaX = genislik * 92 / 1190;
  const kaymaY = genislik * 83 / 1190;
  const nokta = (u, v) => [kaymaX + u * olcek, kaymaY + v * olcek];
  const boya = (x, y, ton) => { if (x >= 0 && y >= 0 && x < genislik && y < yukseklik) veri[y * genislik + x] = Math.min(veri[y * genislik + x], ton); };
  const dikdortgen = (x0, y0, x1, y1, ton) => { for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) boya(x, y, ton); };
  const daire = (cx, cy, ic, dis, ton) => {
    for (let y = Math.floor(cy - dis); y <= Math.ceil(cy + dis); y++) {
      for (let x = Math.floor(cx - dis); x <= Math.ceil(cx + dis); x++) {
        const uzaklik = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (uzaklik >= ic && uzaklik <= dis) boya(x, y, ton);
      }
    }
  };
  if (koseler) {
    const yari = genislik * 17 / 1190;
    for (const [u, v] of [[0, 0], [formSablonu.genislik, 0], [0, formSablonu.yukseklik], [formSablonu.genislik, formSablonu.yukseklik]]) {
      const [x, y] = nokta(u, v);
      dikdortgen(x - yari, y - yari, x + yari, y + yari, 0);
    }
  }
  if (formNo !== undefined) {
    const bitler = [1, sayfaNo - 1, ...formNo.toString(2).padStart(10, '0').split('').map(Number)];
    bitler.forEach((bit, sira) => {
      if (!bit) return;
      const [x, y] = nokta(formSablonu.serit.u0 + sira * formSablonu.serit.adim, formSablonu.serit.v);
      dikdortgen(x - 11.5 * olcek, y - 11.5 * olcek, x + 11.5 * olcek, y + 11.5 * olcek, 0);
    });
  }
  if (olcum) {
    const tur = formSablonu.baslik.turler.find((kayit) => kayit.olcum === olcum);
    const [x0, y0] = nokta(tur.solKenar, 44);
    const [x1, y1] = nokta(1012, 62);
    dikdortgen(x0, y0, x1, y1, 0);
  }
  if (halkalar) {
    for (const alan of formSablonu.sayfalar[sayfaNo]) {
      for (const secenek of alan.secenekler) {
        const [x, y] = nokta(secenek.u, secenek.v);
        daire(x, y, (formSablonu.balonYaricapi - 1.5) * olcek, formSablonu.balonYaricapi * olcek, 0);
        const isaret = (isaretler[alan.ad] ?? []).find((kayit) => kayit.deger === secenek.deger);
        if (isaret) daire(x, y, 0, 11 * olcek, Math.round(255 * (1 - isaret.koyuluk)));
      }
    }
  }
  return { genislik, yukseklik, veri };
}

export function tersCevir(gri) {
  return { genislik: gri.genislik, yukseklik: gri.yukseklik, veri: Uint8Array.from(gri.veri).reverse() };
}

export function dolu(deger, koyuluk = 0.6) {
  return [{ deger, koyuluk }];
}

export function okunmusSayfa({ olcum, formNo, sayfaNo, kod = null, sinif = null, cins = null, yanit = null, dosya = 'ornek.pdf', pdfSayfasi = 1 }) {
  const alanlar = {};
  for (const alan of formSablonu.sayfalar[sayfaNo]) {
    let deger = null;
    if (alan.tur === 'kod') deger = kod?.[Number(alan.ad.slice(3)) - 1] ?? null;
    else if (alan.ad === 'sinif') deger = sinif;
    else if (alan.ad === 'cins') deger = cins;
    else deger = typeof yanit === 'function' ? yanit(alan.ad) : yanit;
    alanlar[alan.ad] = deger === null || deger === undefined ? { durum: 'bos', deger: null } : deger === 'cift' ? { durum: 'cift', deger: null } : { durum: 'isaretli', deger };
  }
  return { taninan: true, olcum, formNo, sayfaNo, alanlar, dosya, pdfSayfasi };
}

export function okunmusForm(ayar) {
  return [okunmusSayfa({ ...ayar, sayfaNo: 1 }), okunmusSayfa({ ...ayar, sayfaNo: 2, pdfSayfasi: (ayar.pdfSayfasi ?? 1) + 1 })];
}

export function hane(metin) {
  return metin.split('').map((harf) => (harf === '_' ? null : Number(harf)));
}
