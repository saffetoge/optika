import { bosDeger, formSablonu, kodHaneSayisi, maddeler, olcumler } from './form-sablonu.js';

export const eslesmeKurali = Object.freeze({ enCokCelisenHane: 2, enAzOrtakHane: 5 });

export const eslesmeYollari = {
  kendi: { etiket: 'Ön test kâğıdı', renk: 'mor' },
  kod: { etiket: 'Kod aynı', renk: 'yesil' },
  yakin: { etiket: 'Kod yakın', renk: 'mor' },
  numara: { etiket: 'Aynı numara, kod uyuşmuyor', renk: 'turuncu' },
};

const kodYollari = ['kod', 'yakin'];
const maddeSayfasi = new Map(Object.entries(formSablonu.sayfalar).flatMap(([sayfaNo, alanlar]) => alanlar.map((alan) => [alan.ad, Number(sayfaNo)])));

export function kodMetni(kod) {
  return kod.map((hane) => (hane === null ? '_' : String(hane))).join('');
}

export function kodKarsilastir(birinci, ikinci) {
  let ortak = 0;
  let celisen = 0;
  for (let hane = 0; hane < kodHaneSayisi; hane++) {
    if (birinci[hane] === null || ikinci[hane] === null) continue;
    if (birinci[hane] === ikinci[hane]) ortak++; else celisen++;
  }
  return { ortak, celisen };
}

function alanDegeri(form, ad) {
  const alan = form.sayfalar[maddeSayfasi.get(ad)]?.alanlar[ad];
  return alan?.durum === 'isaretli' ? alan.deger : null;
}

export function formlariKur(sayfalar) {
  const formlar = new Map();
  const uyarilar = [];
  for (const sayfa of sayfalar) {
    const anahtar = `${sayfa.olcum}:${sayfa.formNo}`;
    if (!formlar.has(anahtar)) formlar.set(anahtar, { olcum: sayfa.olcum, formNo: sayfa.formNo, sayfalar: {} });
    const form = formlar.get(anahtar);
    if (form.sayfalar[sayfa.sayfaNo]) {
      uyarilar.push({ tur: 'mukerrer', olcum: sayfa.olcum, formNo: sayfa.formNo, sayfaNo: sayfa.sayfaNo, dosya: sayfa.dosya, pdfSayfasi: sayfa.pdfSayfasi });
      continue;
    }
    form.sayfalar[sayfa.sayfaNo] = sayfa;
  }
  for (const form of formlar.values()) {
    form.kod = Array.from({ length: kodHaneSayisi }, (_, hane) => alanDegeri(form, `kod${hane + 1}`));
    form.sinif = alanDegeri(form, 'sinif');
    form.cins = alanDegeri(form, 'cins');
    form.yanitlar = maddeler.map((madde) => alanDegeri(form, madde));
    form.isaretliMadde = form.yanitlar.filter((deger) => deger !== null).length;
    form.ciftIsaret = maddeler.filter((madde) => form.sayfalar[maddeSayfasi.get(madde)]?.alanlar[madde]?.durum === 'cift').length;
    for (const sayfaNo of Object.keys(formSablonu.sayfalar).map(Number)) {
      if (!form.sayfalar[sayfaNo]) uyarilar.push({ tur: 'eksik-sayfa', olcum: form.olcum, formNo: form.formNo, sayfaNo });
    }
  }
  return { formlar: [...formlar.values()], uyarilar };
}

function tamKod(form) {
  return form.kod.every((hane) => hane !== null) ? kodMetni(form.kod) : null;
}

function tamKodlaEslestir(ogrenciler, adaylar, atama, alinan, uyarilar, olcum) {
  const ogrenciKodlari = new Map();
  const adayKodlari = new Map();
  for (const ogrenci of ogrenciler) {
    const kod = tamKod(ogrenci);
    if (kod) ogrenciKodlari.set(kod, [...(ogrenciKodlari.get(kod) ?? []), ogrenci]);
  }
  for (const aday of adaylar) {
    const kod = tamKod(aday);
    if (kod) adayKodlari.set(kod, [...(adayKodlari.get(kod) ?? []), aday]);
  }
  for (const [kod, sahipler] of ogrenciKodlari) {
    const eslesenler = adayKodlari.get(kod) ?? [];
    if (!eslesenler.length) continue;
    if (sahipler.length > 1 || eslesenler.length > 1) {
      uyarilar.push({ tur: 'ayni-kod', olcum, kod, ogrenciler: sahipler.map((form) => form.formNo), formlar: eslesenler.map((form) => form.formNo) });
      continue;
    }
    atama.set(sahipler[0], { form: eslesenler[0], yol: 'kod' });
    alinan.add(eslesenler[0]);
  }
}

function digerOlcumDestegi(digerAtamalar) {
  return (ogrenci, aday) => {
    const destek = { ortak: 0, celisen: 0, olcumler: [] };
    for (const [olcum, atama] of digerAtamalar) {
      const bag = atama.get(ogrenci);
      if (!bag || !kodYollari.includes(bag.yol)) continue;
      const { ortak, celisen } = kodKarsilastir(bag.form.kod, aday.kod);
      destek.ortak += ortak;
      destek.celisen += celisen;
      destek.olcumler.push(olcum);
    }
    return destek;
  };
}

function yakinKodlaEslestir(ogrenciler, adaylar, atama, alinan, uyarilar, olcum, kural, destekBul) {
  const ciftler = [];
  for (const ogrenci of ogrenciler) {
    if (atama.has(ogrenci)) continue;
    for (const aday of adaylar) {
      if (alinan.has(aday)) continue;
      const { ortak, celisen } = kodKarsilastir(ogrenci.kod, aday.kod);
      if (ortak >= kural.enAzOrtakHane && celisen <= kural.enCokCelisenHane) ciftler.push({ ogrenci, aday, ortak, celisen, destek: destekBul?.(ogrenci, aday) ?? { ortak: 0, celisen: 0, olcumler: [] } });
    }
  }
  ciftler.sort((a, b) => a.celisen - b.celisen || b.ortak - a.ortak
    || a.destek.celisen - b.destek.celisen || b.destek.ortak - a.destek.ortak
    || a.ogrenci.formNo - b.ogrenci.formNo || a.aday.formNo - b.aday.formNo);
  const belirsiz = new Set();
  const kararsizOgrenciler = new Set();
  const kararsizAdaylar = new Set();
  for (const cift of ciftler) {
    if (atama.has(cift.ogrenci) || alinan.has(cift.aday) || kararsizOgrenciler.has(cift.ogrenci) || kararsizAdaylar.has(cift.aday)) continue;
    const rakipler = ciftler.filter((diger) => diger !== cift
      && diger.celisen === cift.celisen && diger.ortak === cift.ortak
      && ((diger.ogrenci === cift.ogrenci && !alinan.has(diger.aday)) || (diger.aday === cift.aday && !atama.has(diger.ogrenci))));
    const esitler = rakipler.filter((diger) => diger.destek.celisen === cift.destek.celisen && diger.destek.ortak === cift.destek.ortak);
    if (esitler.length) {
      for (const rakip of esitler) {
        if (rakip.ogrenci === cift.ogrenci) kararsizOgrenciler.add(cift.ogrenci); else kararsizAdaylar.add(cift.aday);
        const anahtar = [cift.ogrenci.formNo, cift.aday.formNo, rakip.ogrenci.formNo, rakip.aday.formNo].sort().join(':');
        if (belirsiz.has(anahtar)) continue;
        belirsiz.add(anahtar);
        uyarilar.push({ tur: 'belirsiz-kod', olcum, ogrenciler: [...new Set([cift.ogrenci.formNo, rakip.ogrenci.formNo])], formlar: [...new Set([cift.aday.formNo, rakip.aday.formNo])] });
      }
      continue;
    }
    if (rakipler.length) {
      uyarilar.push({
        tur: 'kod-destegi',
        olcum,
        ogrenci: cift.ogrenci.formNo,
        form: cift.aday.formNo,
        digerOgrenciler: [...new Set(rakipler.filter((rakip) => rakip.ogrenci !== cift.ogrenci).map((rakip) => rakip.ogrenci.formNo))],
        digerFormlar: [...new Set(rakipler.filter((rakip) => rakip.aday !== cift.aday).map((rakip) => rakip.aday.formNo))],
        destekOlcumleri: [...new Set(rakipler.flatMap((rakip) => rakip.destek.olcumler).concat(cift.destek.olcumler))],
      });
    }
    atama.set(cift.ogrenci, { form: cift.aday, yol: 'yakin', ortak: cift.ortak, celisen: cift.celisen });
    alinan.add(cift.aday);
  }
}

function numaraylaEslestir(ogrenciler, adaylar, atama, alinan) {
  const numarali = new Map(adaylar.map((aday) => [aday.formNo, aday]));
  for (const ogrenci of ogrenciler) {
    if (atama.has(ogrenci)) continue;
    const aday = numarali.get(ogrenci.formNo);
    if (!aday || alinan.has(aday)) continue;
    atama.set(ogrenci, { form: aday, yol: 'numara' });
    alinan.add(aday);
  }
}

export function olcumleriBirlestir(sayfalar, kural = eslesmeKurali) {
  const { formlar, uyarilar } = formlariKur(sayfalar);
  const [ilkOlcum, ...sonrakiOlcumler] = olcumler.map((olcum) => olcum.kod);
  const ogrenciler = formlar.filter((form) => form.olcum === ilkOlcum).sort((a, b) => a.formNo - b.formNo);
  const adaylar = Object.fromEntries(sonrakiOlcumler.map((olcum) => [olcum, formlar.filter((form) => form.olcum === olcum).sort((a, b) => a.formNo - b.formNo)]));
  const kodlaEslestir = (olcum, destekBul) => {
    const durum = { atama: new Map(), alinan: new Set(), uyarilar: [] };
    tamKodlaEslestir(ogrenciler, adaylar[olcum], durum.atama, durum.alinan, durum.uyarilar, olcum);
    yakinKodlaEslestir(ogrenciler, adaylar[olcum], durum.atama, durum.alinan, durum.uyarilar, olcum, kural, destekBul);
    return durum;
  };
  const ilkTur = Object.fromEntries(sonrakiOlcumler.map((olcum) => [olcum, kodlaEslestir(olcum)]));
  const atamalar = {};
  const eslesmeyenler = [];
  for (const olcum of sonrakiOlcumler) {
    const kararsiz = ilkTur[olcum].uyarilar.some((uyari) => uyari.tur === 'belirsiz-kod');
    const digerleri = sonrakiOlcumler.filter((diger) => diger !== olcum).map((diger) => [diger, ilkTur[diger].atama]);
    const durum = kararsiz ? kodlaEslestir(olcum, digerOlcumDestegi(digerleri)) : ilkTur[olcum];
    uyarilar.push(...durum.uyarilar);
    numaraylaEslestir(ogrenciler, adaylar[olcum], durum.atama, durum.alinan);
    atamalar[olcum] = durum.atama;
    eslesmeyenler.push(...adaylar[olcum].filter((aday) => !durum.alinan.has(aday)));
  }
  const satirlar = ogrenciler.map((ogrenci) => {
    const baglar = { [ilkOlcum]: { form: ogrenci, yol: 'kendi' } };
    for (const olcum of sonrakiOlcumler) baglar[olcum] = atamalar[olcum].get(ogrenci) ?? null;
    const tam = sonrakiOlcumler.every((olcum) => baglar[olcum] && kodYollari.includes(baglar[olcum].yol));
    return { ogrenci: ogrenci.formNo, kod: ogrenci.kod, sinif: ogrenci.sinif, cins: ogrenci.cins, ucOlcumTam: tam, baglar };
  });
  return { satirlar, eslesmeyenler, uyarilar, formlar };
}

export function veriTablosu(satirlar, okul) {
  const basliklar = ['ogrenci', 'okul', 'sinif', 'cins', 'uc_olcum_tam', 'kod_celiskisi', ...olcumler.flatMap((olcum) => maddeler.map((madde) => `${madde}_${olcum.kod}`))];
  const govde = satirlar.map((satir) => [
    satir.ogrenci,
    okul,
    satir.sinif ?? bosDeger,
    satir.cins ?? bosDeger,
    satir.ucOlcumTam ? 1 : 0,
    satir.ucOlcumTam ? 0 : 1,
    ...olcumler.flatMap((olcum) => {
      const bag = satir.baglar[olcum.kod];
      return bag ? bag.form.yanitlar.map((deger) => deger ?? bosDeger) : maddeler.map(() => '');
    }),
  ]);
  return { basliklar, satirlar: govde };
}
