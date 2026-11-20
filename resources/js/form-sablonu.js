export const olcekler = [
  { kod: 'BSB', ad: 'Bilişsel Süreç Becerileri ve Dijital Yetkinlik', maddeSayisi: 41 },
  { kod: 'FLT', ad: 'Fen Laboratuvarı Tutum', maddeSayisi: 13 },
  { kod: 'FOY', ad: 'Fizik Öz-Yeterlilik', maddeSayisi: 28 },
  { kod: 'YZT', ad: 'Yapay Zekâ Tutum', maddeSayisi: 21 },
];

export const maddeler = olcekler.flatMap((olcek) => Array.from({ length: olcek.maddeSayisi }, (_, sira) => `${olcek.kod}${sira + 1}`));

export const olcumler = [
  { kod: 'on', ad: 'Ön test' },
  { kod: 'son', ad: 'Son test' },
  { kod: 'kal', ad: 'Kalıcılık testi' },
];

export const kodHaneSayisi = 8;
export const bosDeger = -99;

const likert = [1, 2, 3, 4, 5];
const rakamlar = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function maddeAlanlari(bloklar, v0, adim, adlar) {
  return adlar.flatMap((sutun, blok) => sutun.map((ad, satir) => ({
    ad,
    tur: 'madde',
    secenekler: likert.map((deger, sira) => ({ deger, u: bloklar[blok][sira], v: v0 + satir * adim })),
  })));
}

function sirali(kod, ilk, son) {
  return Array.from({ length: son - ilk + 1 }, (_, sira) => `${kod}${ilk + sira}`);
}

const kodAlanlari = Array.from({ length: kodHaneSayisi }, (_, hane) => ({
  ad: `kod${hane + 1}`,
  tur: 'kod',
  secenekler: rakamlar.map((deger) => ({ deger, u: 16.15 + hane * 36.893, v: 243.29 + deger * 33.49 })),
}));

const sinifAlani = {
  ad: 'sinif',
  tur: 'kimlik',
  secenekler: [9, 10, 11, 12].map((deger, sira) => ({ deger, u: [449.26, 482.41, 515.25, 547.94][sira], v: 405.72 })),
};

const cinsiyetAlani = {
  ad: 'cins',
  tur: 'kimlik',
  secenekler: [{ deger: 1, etiket: 'Kız', u: 721.93, v: 405.67 }, { deger: 2, etiket: 'Erkek', u: 754, v: 405.67 }],
};

export function cinsiyetEtiketi(deger) {
  return cinsiyetAlani.secenekler.find((secenek) => secenek.deger === deger)?.etiket ?? 'Belirtilmemiş';
}

export function olcumAdi(kod) {
  return olcumler.find((olcum) => olcum.kod === kod)?.ad ?? 'Belirtilmemiş';
}

const birinciSayfa = maddeAlanlari(
  [[63.65, 96.48, 129.7, 162.72, 195.63], [322.8, 355.42, 388.26, 421.09, 453.79], [581.29, 614.05, 646.82, 679.63, 712.57], [838.93, 871.5, 903.92, 937.01, 969.82]],
  656.34,
  53.415,
  [sirali('BSB', 1, 14), sirali('BSB', 15, 28), [...sirali('BSB', 29, 41), 'FLT1'], sirali('FLT', 2, 13)],
);

const ikinciSayfa = maddeAlanlari(
  [[63.58, 96.49, 129.56, 162.67, 196.48], [323.7, 356.32, 388.94, 421.61, 454.37], [581.3, 613.94, 646.79, 679.8, 712.55], [839.23, 871.95, 904.55, 937.26, 969.85]],
  312.05,
  54.688,
  [sirali('FOY', 1, 13), sirali('FOY', 14, 26), [...sirali('FOY', 27, 28), ...sirali('YZT', 1, 11)], sirali('YZT', 12, 21)],
);

export const formSablonu = {
  ad: 'Dijital Yetkinlik Atölyeleri öğrenci cevap kâğıdı',
  genislik: 1000,
  yukseklik: 1490,
  balonYaricapi: 13.3,
  olcumYaricapOrani: 0.64,
  halka: { icPay: 2.5, disPay: 1.5 },
  kose: { kenarOrani: 34 / 1190, aramaEni: 0.26, aramaBoyu: 0.2, enAzDoluluk: 0.55, enAzFark: 0.5, cevrePayi: 0.45, oranPayi: 0.03 },
  serit: { hucreSayisi: 12, u0: 311.8, adim: 34.443, v: 1439.2, yariKenar: 7 },
  baslik: {
    u0: 780,
    u1: 1030,
    v0: 36,
    v1: 70,
    pencere: 8,
    esik: 0.1,
    pay: 6,
    turler: [{ olcum: 'on', solKenar: 924 }, { olcum: 'son', solKenar: 910 }, { olcum: 'kal', solKenar: 843 }],
  },
  sayfalar: {
    1: [...kodAlanlari, sinifAlani, cinsiyetAlani, ...birinciSayfa],
    2: ikinciSayfa,
  },
};
