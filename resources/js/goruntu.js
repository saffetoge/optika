export function koyulukTablosu(gri) {
  const { genislik, yukseklik, veri } = gri;
  const en = genislik + 1;
  const tablo = new Float64Array(en * (yukseklik + 1));
  for (let y = 0; y < yukseklik; y++) {
    let satirToplami = 0;
    for (let x = 0; x < genislik; x++) {
      satirToplami += 255 - veri[y * genislik + x];
      tablo[(y + 1) * en + x + 1] = tablo[y * en + x + 1] + satirToplami;
    }
  }
  return { tablo, en, genislik, yukseklik };
}

export function dikdortgenKoyulugu(koyuluk, x0, y0, x1, y1) {
  const sol = Math.max(0, Math.min(koyuluk.genislik, Math.round(Math.min(x0, x1))));
  const sag = Math.max(0, Math.min(koyuluk.genislik, Math.round(Math.max(x0, x1))));
  const ust = Math.max(0, Math.min(koyuluk.yukseklik, Math.round(Math.min(y0, y1))));
  const alt = Math.max(0, Math.min(koyuluk.yukseklik, Math.round(Math.max(y0, y1))));
  const alan = (sag - sol) * (alt - ust);
  if (alan <= 0) return 0;
  const { tablo, en } = koyuluk;
  return (tablo[alt * en + sag] - tablo[ust * en + sag] - tablo[alt * en + sol] + tablo[ust * en + sol]) / (alan * 255);
}

export function daireKoyulugu(gri, merkezX, merkezY, yaricap) {
  const { genislik, yukseklik, veri } = gri;
  const kare = yaricap * yaricap;
  let toplam = 0;
  let adet = 0;
  for (let y = Math.floor(merkezY - yaricap); y <= Math.ceil(merkezY + yaricap); y++) {
    if (y < 0 || y >= yukseklik) continue;
    for (let x = Math.floor(merkezX - yaricap); x <= Math.ceil(merkezX + yaricap); x++) {
      if (x < 0 || x >= genislik) continue;
      const dx = x + 0.5 - merkezX;
      const dy = y + 0.5 - merkezY;
      if (dx * dx + dy * dy > kare) continue;
      toplam += 255 - veri[y * genislik + x];
      adet++;
    }
  }
  return adet ? toplam / (adet * 255) : 0;
}

export function halkaKoyulugu(gri, merkezX, merkezY, icYaricap, disYaricap) {
  const { genislik, yukseklik, veri } = gri;
  const ic = icYaricap * icYaricap;
  const dis = disYaricap * disYaricap;
  let toplam = 0;
  let adet = 0;
  for (let y = Math.floor(merkezY - disYaricap); y <= Math.ceil(merkezY + disYaricap); y++) {
    if (y < 0 || y >= yukseklik) continue;
    for (let x = Math.floor(merkezX - disYaricap); x <= Math.ceil(merkezX + disYaricap); x++) {
      if (x < 0 || x >= genislik) continue;
      const uzaklik = (x + 0.5 - merkezX) ** 2 + (y + 0.5 - merkezY) ** 2;
      if (uzaklik < ic || uzaklik > dis) continue;
      toplam += 255 - veri[y * genislik + x];
      adet++;
    }
  }
  return adet ? toplam / (adet * 255) : 0;
}

export function agirlikMerkezi(koyuluk, x0, y0, x1, y1) {
  let toplamX = 0;
  let agirlikX = 0;
  for (let x = Math.round(x0); x < Math.round(x1); x++) {
    const deger = dikdortgenKoyulugu(koyuluk, x, y0, x + 1, y1);
    toplamX += deger * (x + 0.5);
    agirlikX += deger;
  }
  let toplamY = 0;
  let agirlikY = 0;
  for (let y = Math.round(y0); y < Math.round(y1); y++) {
    const deger = dikdortgenKoyulugu(koyuluk, x0, y, x1, y + 1);
    toplamY += deger * (y + 0.5);
    agirlikY += deger;
  }
  if (!agirlikX || !agirlikY) return null;
  return { x: toplamX / agirlikX, y: toplamY / agirlikY };
}

function dogrusalCozum(katsayilar, sabitler) {
  const boyut = sabitler.length;
  const matris = katsayilar.map((satir, sira) => [...satir, sabitler[sira]]);
  for (let i = 0; i < boyut; i++) {
    let secilen = i;
    for (let r = i + 1; r < boyut; r++) if (Math.abs(matris[r][i]) > Math.abs(matris[secilen][i])) secilen = r;
    if (Math.abs(matris[secilen][i]) < 1e-12) return null;
    [matris[i], matris[secilen]] = [matris[secilen], matris[i]];
    for (let r = i + 1; r < boyut; r++) {
      const oran = matris[r][i] / matris[i][i];
      for (let c = i; c <= boyut; c++) matris[r][c] -= oran * matris[i][c];
    }
  }
  const cozum = new Array(boyut).fill(0);
  for (let i = boyut - 1; i >= 0; i--) {
    let deger = matris[i][boyut];
    for (let c = i + 1; c < boyut; c++) deger -= matris[i][c] * cozum[c];
    cozum[i] = deger / matris[i][i];
  }
  return cozum;
}

export function donusumKur(kaynak, hedef) {
  const katsayilar = [];
  const sabitler = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = kaynak[i];
    const [u, v] = hedef[i];
    katsayilar.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    sabitler.push(u);
    katsayilar.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    sabitler.push(v);
  }
  const h = dogrusalCozum(katsayilar, sabitler);
  if (!h) return null;
  return ([x, y]) => {
    const payda = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / payda, (h[3] * x + h[4] * y + h[5]) / payda];
  };
}
