import test from 'node:test';
import assert from 'node:assert/strict';
import { alanKarari, sayfaOku, taninmamaNedenleri } from '../../../resources/js/optik-okuyucu.js';
import { formSablonu, maddeler, olcekler } from '../../../resources/js/form-sablonu.js';
import { okumaProfili } from '../../../resources/js/okuma-profili.js';
import { dolu, sayfaCiz, tersCevir } from './yardimci.js';

const ayar = okumaProfili.parametreler;
const secenekler = [1, 2, 3, 4, 5].map((deger) => ({ deger }));

test('Form şablonu 103 maddeyi iki sayfaya eksiksiz ve tekrarsız dağıtır', () => {
  assert.equal(maddeler.length, 103);
  assert.equal(olcekler.reduce((toplam, olcek) => toplam + olcek.maddeSayisi, 0), 103);
  const adlar = Object.values(formSablonu.sayfalar).flatMap((alanlar) => alanlar.filter((alan) => alan.tur === 'madde').map((alan) => alan.ad));
  assert.deepEqual([...adlar].sort(), [...maddeler].sort());
  assert.equal(new Set(adlar).size, 103);
  assert.equal(formSablonu.sayfalar[1].filter((alan) => alan.tur === 'kod').length, 8);
  assert.ok(formSablonu.sayfalar[1].every((alan) => alan.tur !== 'kod' || alan.secenekler.length === 10));
});

test('Birinci sayfa: form numarası, ölçüm, kişisel kod, sınıf, cinsiyet ve yanıtlar okunur', () => {
  const kod = [0, 6, 0, 5, 1, 3, 0, 9];
  const isaretler = { sinif: dolu(10), cins: dolu(1), BSB1: dolu(3), BSB14: dolu(5), BSB41: dolu(1), FLT1: dolu(2), FLT13: dolu(4) };
  kod.forEach((rakam, sira) => { isaretler[`kod${sira + 1}`] = dolu(rakam); });
  const okuma = sayfaOku(sayfaCiz({ sayfaNo: 1, formNo: 523, olcum: 'kal', isaretler }), formSablonu, ayar);
  assert.equal(okuma.taninan, true);
  assert.equal(okuma.formNo, 523);
  assert.equal(okuma.sayfaNo, 1);
  assert.equal(okuma.olcum, 'kal');
  assert.equal(okuma.ters, false);
  assert.deepEqual(kod.map((_, sira) => okuma.alanlar[`kod${sira + 1}`].deger), kod);
  assert.equal(okuma.alanlar.sinif.deger, 10);
  assert.equal(okuma.alanlar.cins.deger, 1);
  assert.deepEqual(['BSB1', 'BSB14', 'BSB41', 'FLT1', 'FLT13'].map((ad) => okuma.alanlar[ad].deger), [3, 5, 1, 2, 4]);
  assert.equal(okuma.alanlar.BSB2.durum, 'bos');
  assert.equal(okuma.alanlar.FOY1, undefined);
});

test('İkinci sayfa ve her üç ölçüm başlığı tanınır', () => {
  for (const olcum of ['on', 'son', 'kal']) {
    const okuma = sayfaOku(sayfaCiz({ sayfaNo: 2, formNo: 507, olcum, isaretler: { FOY1: dolu(1), FOY28: dolu(5), YZT21: dolu(3) } }), formSablonu, ayar);
    assert.equal(okuma.taninan, true);
    assert.equal(okuma.sayfaNo, 2);
    assert.equal(okuma.formNo, 507);
    assert.equal(okuma.olcum, olcum);
    assert.deepEqual([okuma.alanlar.FOY1.deger, okuma.alanlar.FOY28.deger, okuma.alanlar.YZT21.deger], [1, 5, 3]);
  }
  assert.equal(sayfaOku(sayfaCiz({ sayfaNo: 2, formNo: 507 }), formSablonu, ayar).olcum, null);
});

test('Baş aşağı taranan sayfa aynı sonuçla okunur', () => {
  const duz = sayfaCiz({ sayfaNo: 1, formNo: 539, olcum: 'son', isaretler: { kod1: dolu(0), kod8: dolu(7), BSB7: dolu(2), FLT9: dolu(5) } });
  const okuma = sayfaOku(tersCevir(duz), formSablonu, ayar);
  assert.equal(okuma.taninan, true);
  assert.equal(okuma.ters, true);
  assert.equal(okuma.formNo, 539);
  assert.equal(okuma.olcum, 'son');
  assert.deepEqual([okuma.alanlar.kod1.deger, okuma.alanlar.kod8.deger, okuma.alanlar.BSB7.deger, okuma.alanlar.FLT9.deger], [0, 7, 2, 5]);
});

test('Farklı tarama çözünürlüğünde sonuç değişmez', () => {
  for (const genislik of [893, 1190, 1785]) {
    const okuma = sayfaOku(sayfaCiz({ sayfaNo: 1, formNo: 504, olcum: 'on', genislik, isaretler: { kod3: dolu(4), BSB30: dolu(4), cins: dolu(2) } }), formSablonu, ayar);
    assert.equal(okuma.taninan, true, `genişlik ${genislik}`);
    assert.deepEqual([okuma.formNo, okuma.olcum, okuma.alanlar.kod3.deger, okuma.alanlar.BSB30.deger, okuma.alanlar.cins.deger], [504, 'on', 4, 4, 2]);
  }
});

test('Silik işaret yanıt sayılır, çift işaret ve boş satır değer üretmez', () => {
  const isaretler = {
    BSB1: dolu(4, 0.1),
    BSB2: [{ deger: 2, koyuluk: 0.6 }, { deger: 4, koyuluk: 0.55 }],
    BSB3: [{ deger: 3, koyuluk: 0.6 }, { deger: 5, koyuluk: 0.12 }],
  };
  const okuma = sayfaOku(sayfaCiz({ sayfaNo: 1, formNo: 510, olcum: 'on', isaretler }), formSablonu, ayar);
  assert.deepEqual([okuma.alanlar.BSB1.durum, okuma.alanlar.BSB1.deger, okuma.alanlar.BSB1.silik], ['isaretli', 4, true]);
  assert.deepEqual([okuma.alanlar.BSB2.durum, okuma.alanlar.BSB2.deger], ['cift', null]);
  assert.deepEqual([okuma.alanlar.BSB3.durum, okuma.alanlar.BSB3.deger, okuma.alanlar.BSB3.ikinciIz], ['isaretli', 3, true]);
  assert.deepEqual([okuma.alanlar.BSB4.durum, okuma.alanlar.BSB4.deger], ['bos', null]);
});

test('Karar kuralı eşikleri okuma profilinden alır', () => {
  assert.equal(alanKarari([0, 0.02, 0, 0, 0], secenekler, ayar).durum, 'bos');
  assert.equal(alanKarari([0, 0.05, 0, 0, 0], secenekler, ayar).deger, 2);
  assert.equal(alanKarari([0, 0.6, 0.27, 0, 0], secenekler, ayar).deger, 2);
  assert.equal(alanKarari([0, 0.6, 0.4, 0, 0], secenekler, ayar).durum, 'cift');
  assert.equal(alanKarari([0, 0.05, 0, 0, 0], secenekler, { ...ayar, isaretEsigi: 0.1 }).durum, 'bos');
});

test('Cevap kâğıdı olmayan sayfa nedeniyle birlikte ayrılır', () => {
  const bos = { genislik: 1190, yukseklik: 1684, veri: new Uint8Array(1190 * 1684).fill(255) };
  assert.deepEqual(sayfaOku(bos, formSablonu, ayar), { taninan: false, neden: 'kose' });
  assert.equal(sayfaOku(sayfaCiz({ sayfaNo: 1, koseler: true, halkalar: false }), formSablonu, ayar).neden, 'serit');
  assert.equal(sayfaOku(sayfaCiz({ sayfaNo: 1, formNo: 518, halkalar: false }), formSablonu, ayar).neden, 'duzen');
  assert.equal(sayfaOku(sayfaCiz({ sayfaNo: 1, formNo: 518, koseler: false }), formSablonu, ayar).neden, 'kose');
  for (const neden of ['kose', 'oran', 'serit', 'duzen', 'olcum']) assert.ok(taninmamaNedenleri[neden]);
});
