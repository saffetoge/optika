import { agirlikMerkezi, dikdortgenKoyulugu, donusumKur } from './goruntu.js';

function koseAra(koyuluk, bolge, kenar, ayar) {
  const adim = Math.max(1, Math.floor(kenar / 12));
  const pay = kenar * ayar.cevrePayi;
  const disAlan = (kenar + 2 * pay) ** 2;
  let enIyi = null;
  for (let y = bolge.y0; y + kenar <= bolge.y1; y += adim) {
    for (let x = bolge.x0; x + kenar <= bolge.x1; x += adim) {
      const ic = dikdortgenKoyulugu(koyuluk, x, y, x + kenar, y + kenar);
      if (ic < ayar.enAzDoluluk) continue;
      const dis = dikdortgenKoyulugu(koyuluk, x - pay, y - pay, x + kenar + pay, y + kenar + pay);
      const cevre = (dis * disAlan - ic * kenar * kenar) / (disAlan - kenar * kenar);
      if (!enIyi || ic - cevre > enIyi.puan) enIyi = { x, y, puan: ic - cevre };
    }
  }
  if (!enIyi || enIyi.puan < ayar.enAzFark) return null;
  let { x, y } = enIyi;
  let enYuksek = dikdortgenKoyulugu(koyuluk, x, y, x + kenar, y + kenar);
  for (let dy = -adim; dy <= adim; dy++) {
    for (let dx = -adim; dx <= adim; dx++) {
      const deger = dikdortgenKoyulugu(koyuluk, enIyi.x + dx, enIyi.y + dy, enIyi.x + dx + kenar, enIyi.y + dy + kenar);
      if (deger > enYuksek) { enYuksek = deger; x = enIyi.x + dx; y = enIyi.y + dy; }
    }
  }
  return agirlikMerkezi(koyuluk, x - 2, y - 2, x + kenar + 2, y + kenar + 2) ?? { x: x + kenar / 2, y: y + kenar / 2 };
}

export function koseleriBul(koyuluk, sablon) {
  const { genislik, yukseklik } = koyuluk;
  const ayar = sablon.kose;
  const kenar = Math.round(genislik * ayar.kenarOrani);
  const en = Math.round(genislik * ayar.aramaEni);
  const boy = Math.round(yukseklik * ayar.aramaBoyu);
  const bolgeler = [
    { x0: 0, y0: 0, x1: en, y1: boy },
    { x0: genislik - en, y0: 0, x1: genislik, y1: boy },
    { x0: 0, y0: yukseklik - boy, x1: en, y1: yukseklik },
    { x0: genislik - en, y0: yukseklik - boy, x1: genislik, y1: yukseklik },
  ];
  const koseler = bolgeler.map((bolge) => koseAra(koyuluk, bolge, kenar, ayar));
  return koseler.some((kose) => !kose) ? null : koseler;
}

export function hizalamaKur(koseler, sablon) {
  const [solUst, sagUst, solAlt, sagAlt] = koseler;
  const ustEn = Math.hypot(sagUst.x - solUst.x, sagUst.y - solUst.y);
  const altEn = Math.hypot(sagAlt.x - solAlt.x, sagAlt.y - solAlt.y);
  const solBoy = Math.hypot(solAlt.x - solUst.x, solAlt.y - solUst.y);
  const sagBoy = Math.hypot(sagAlt.x - sagUst.x, sagAlt.y - sagUst.y);
  const pay = sablon.kose.oranPayi;
  const oran = (solBoy + sagBoy) / (ustEn + altEn);
  if (Math.abs(oran / (sablon.yukseklik / sablon.genislik) - 1) > pay) return null;
  if (Math.abs(ustEn / altEn - 1) > pay || Math.abs(solBoy / sagBoy - 1) > pay) return null;
  const hedef = koseler.map((kose) => [kose.x, kose.y]);
  const kaynak = [[0, 0], [sablon.genislik, 0], [0, sablon.yukseklik], [sablon.genislik, sablon.yukseklik]];
  const duz = donusumKur(kaynak, hedef);
  const ters = donusumKur(kaynak, [hedef[3], hedef[2], hedef[1], hedef[0]]);
  if (!duz || !ters) return null;
  return { duz, ters, olcek: (ustEn + altEn) / (2 * sablon.genislik) };
}
