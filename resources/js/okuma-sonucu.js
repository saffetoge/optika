import { olcumler } from './form-sablonu.js';
import { kodMetni, olcumleriBirlestir, veriTablosu } from './olcum-birlestirme.js';

export const sonucSurumu = 1;

const harfKarsiliklari = { Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U', Â: 'A', Î: 'I', Û: 'U' };
const olcumSozcukleri = new Set(['ön', 'on', 'son', 'kalıcılık', 'kalicilik', 'test', 'testi', 'testleri']);

export function okulKodunuDuzenle(metin) {
  return String(metin ?? '')
    .normalize('NFC')
    .trim()
    .toLocaleUpperCase('tr')
    .replace(/[ÇĞİÖŞÜÂÎÛ]/g, (harf) => harfKarsiliklari[harf])
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 30);
}

export function okulKoduOner(dosyaAdlari) {
  const parcalar = dosyaAdlari.map((ad) => ad.normalize('NFC').replace(/\.pdf$/i, '').trim().split(/[\s_-]+/).filter(Boolean));
  if (!parcalar.length) return '';
  const ortak = [];
  for (let sira = 0; sira < parcalar[0].length; sira++) {
    const kelime = parcalar[0][sira].toLocaleLowerCase('tr');
    if (!parcalar.every((parca) => parca[sira]?.toLocaleLowerCase('tr') === kelime)) break;
    ortak.push(kelime);
  }
  return okulKodunuDuzenle(ortak.filter((kelime) => !olcumSozcukleri.has(kelime)).join(' '));
}

function kaynakSayfalar(form) {
  return Object.values(form.sayfalar).map((sayfa) => ({ dosya: sayfa.dosya, pdfSayfasi: sayfa.pdfSayfasi, sayfaNo: sayfa.sayfaNo }));
}

function formOzeti(form) {
  return { formNo: form.formNo, kod: kodMetni(form.kod), isaretli: form.isaretliMadde, cift: form.ciftIsaret, sayfalar: kaynakSayfalar(form) };
}

export function okumaSonucuKur({ okul, dosyalar, profilSurumu, tarih }) {
  const formSayfalari = [];
  const ayrilanlar = [];
  const uyarilar = [];
  const dosyaOzetleri = [];
  for (const dosya of dosyalar) {
    const sayim = {};
    for (const sayfa of dosya.sayfalar) {
      if (sayfa.okuma.taninan && sayfa.okuma.olcum) sayim[sayfa.okuma.olcum] = (sayim[sayfa.okuma.olcum] ?? 0) + 1;
    }
    const cogunluk = Object.entries(sayim).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const ozet = { ad: dosya.ad, sayfaSayisi: dosya.sayfalar.length, okunan: 0, ayrilan: 0, olcumler: {} };
    for (const sayfa of dosya.sayfalar) {
      const olcum = sayfa.okuma.taninan ? sayfa.okuma.olcum ?? cogunluk : null;
      if (!olcum) {
        ayrilanlar.push({ dosya: dosya.ad, pdfSayfasi: sayfa.pdfSayfasi, neden: sayfa.okuma.taninan ? 'olcum' : sayfa.okuma.neden, resim: sayfa.resim ?? null });
        ozet.ayrilan++;
        continue;
      }
      if (!sayfa.okuma.olcum) uyarilar.push({ tur: 'olcum-tahmini', dosya: dosya.ad, pdfSayfasi: sayfa.pdfSayfasi, olcum });
      ozet.okunan++;
      ozet.olcumler[olcum] = (ozet.olcumler[olcum] ?? 0) + 1;
      formSayfalari.push({ ...sayfa.okuma, olcum, dosya: dosya.ad, pdfSayfasi: sayfa.pdfSayfasi });
    }
    dosyaOzetleri.push(ozet);
  }
  const birlesim = olcumleriBirlestir(formSayfalari);
  const ilkOlcum = olcumler[0];
  if (formSayfalari.length && !birlesim.satirlar.length) uyarilar.push({ tur: 'ilk-olcum-yok', olcum: ilkOlcum.kod });
  const ogrenciler = birlesim.satirlar.map((satir) => ({
    ogrenci: satir.ogrenci,
    kod: kodMetni(satir.kod),
    sinif: satir.sinif,
    cins: satir.cins,
    ucOlcumTam: satir.ucOlcumTam,
    olcumler: Object.fromEntries(olcumler.map(({ kod }) => {
      const bag = satir.baglar[kod];
      return [kod, bag ? { ...formOzeti(bag.form), yol: bag.yol, ortak: bag.ortak ?? null, celisen: bag.celisen ?? null } : null];
    })),
  }));
  let silik = 0;
  let cift = 0;
  for (const sayfa of formSayfalari) {
    for (const alan of Object.values(sayfa.alanlar)) {
      if (alan.durum === 'cift') cift++;
      else if (alan.silik) silik++;
    }
  }
  return {
    surum: sonucSurumu,
    okul,
    tarih,
    profilSurumu,
    dosyalar: dosyaOzetleri,
    ogrenciler,
    tablo: veriTablosu(birlesim.satirlar, okul),
    eslesmeyenler: birlesim.eslesmeyenler.map((form) => ({ olcum: form.olcum, ...formOzeti(form) })),
    ayrilanlar,
    uyarilar: [...uyarilar, ...birlesim.uyarilar],
    isaretOzeti: { silik, cift },
  };
}

export function tamOlanlarTablosu(tablo) {
  const sutun = tablo.basliklar.indexOf('uc_olcum_tam');
  return { basliklar: tablo.basliklar, satirlar: tablo.satirlar.filter((satir) => satir[sutun] === 1) };
}

export function veriDosyalari(sonuc) {
  return [
    { ad: `${sonuc.okul}_TUM_VERI.csv`, tablo: sonuc.tablo },
    { ad: `${sonuc.okul}_UC_OLCUM_TAM.csv`, tablo: tamOlanlarTablosu(sonuc.tablo) },
  ];
}
