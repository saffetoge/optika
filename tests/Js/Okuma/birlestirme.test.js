import test from 'node:test';
import assert from 'node:assert/strict';
import { eslesmeKurali, eslesmeYollari, kodKarsilastir, kodMetni, olcumleriBirlestir, veriTablosu } from '../../../resources/js/olcum-birlestirme.js';
import { csvMetni } from '../../../resources/js/csv.js';
import { maddeler } from '../../../resources/js/form-sablonu.js';
import { hane, okunmusForm, okunmusSayfa } from './yardimci.js';

function form(olcum, formNo, kod, ek = {}) {
  return okunmusForm({ olcum, formNo, kod: kod ? hane(kod) : null, sinif: 10, cins: 1, yanit: 3, ...ek });
}

function bag(sonuc, ogrenci, olcum) {
  const kayit = sonuc.satirlar.find((satir) => satir.ogrenci === ogrenci).baglar[olcum];
  return kayit ? [kayit.form.formNo, kayit.yol] : null;
}

test('Kod karşılaştırması ortak ve çelişen haneleri ayrı sayar, boş haneyi saymaz', () => {
  assert.deepEqual(kodKarsilastir(hane('06051309'), hane('06051309')), { ortak: 8, celisen: 0 });
  assert.deepEqual(kodKarsilastir(hane('06092911'), hane('0509__11')), { ortak: 5, celisen: 1 });
  assert.deepEqual(kodKarsilastir(hane('________'), hane('06051309')), { ortak: 0, celisen: 0 });
  assert.equal(kodMetni(hane('0509__11')), '0509__11');
});

test('Öğrenci farklı numaralı kâğıt kullansa da kişisel kodla eşleşir', () => {
  const sonuc = olcumleriBirlestir([...form('on', 506, '06050711'), ...form('son', 507, '06050711'), ...form('kal', 537, '06050711'), ...form('son', 506, '05092911')]);
  assert.deepEqual(bag(sonuc, 506, 'son'), [507, 'kod']);
  assert.deepEqual(bag(sonuc, 506, 'kal'), [537, 'kod']);
  assert.equal(sonuc.satirlar[0].ucOlcumTam, true);
  assert.deepEqual(sonuc.eslesmeyenler.map((kagit) => [kagit.olcum, kagit.formNo]), [['son', 506]]);
});

test('Yakın kod kural sınırı içinde eşleşir, sınırı aşan eşleşmez', () => {
  const sayfalar = [
    ...form('on', 504, '06092911'), ...form('son', 506, '05092911'), ...form('kal', 539, '0509__11'),
    ...form('on', 505, '08052005'), ...form('kal', 526, '0905____'),
    ...form('on', 520, '07052105'), ...form('son', 530, '07090205'),
  ];
  const sonuc = olcumleriBirlestir(sayfalar);
  assert.deepEqual(bag(sonuc, 504, 'son'), [506, 'yakin']);
  assert.deepEqual(bag(sonuc, 504, 'kal'), [539, 'yakin']);
  assert.equal(bag(sonuc, 505, 'kal'), null);
  assert.equal(bag(sonuc, 520, 'son'), null);
  assert.deepEqual([eslesmeKurali.enCokCelisenHane, eslesmeKurali.enAzOrtakHane], [2, 5]);
  const sikiSonuc = olcumleriBirlestir(sayfalar, { enCokCelisenHane: 0, enAzOrtakHane: 8 });
  assert.equal(bag(sikiSonuc, 504, 'son'), null);
});

test('Tam kod eşleşmesi yakın eşleşmeden önce gelir', () => {
  const sonuc = olcumleriBirlestir([...form('on', 515, '06051309'), ...form('kal', 513, '04071309'), ...form('kal', 523, '06051309')]);
  assert.deepEqual(bag(sonuc, 515, 'kal'), [523, 'kod']);
  assert.deepEqual(sonuc.eslesmeyenler.map((kagit) => kagit.formNo), [513]);
});

test('İki kâğıt eşit yakınlıktaysa hiçbiri bağlanmaz ve uyarı verilir', () => {
  const sonuc = olcumleriBirlestir([...form('on', 526, '05042707'), ...form('son', 504, '05040767'), ...form('son', 532, '06042702')]);
  assert.equal(bag(sonuc, 526, 'son'), null);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'belirsiz-kod').map((uyari) => [uyari.olcum, uyari.ogrenciler, uyari.formlar]), [['son', [526], [504, 532]]]);
  assert.equal(sonuc.satirlar[0].ucOlcumTam, false);
});

test('Eşit yakınlıktaki iki kâğıttan, öğrencinin diğer ölçümdeki koduna yakın olan bağlanır', () => {
  const sonuc = olcumleriBirlestir([
    ...form('on', 526, '05042707'), ...form('son', 504, '05040767'), ...form('son', 532, '06042702'), ...form('kal', 510, '06042707'),
    ...form('on', 532, null, { sinif: null, cins: null, yanit: null }),
  ]);
  assert.deepEqual(bag(sonuc, 526, 'son'), [532, 'yakin']);
  assert.deepEqual(bag(sonuc, 526, 'kal'), [510, 'yakin']);
  assert.equal(bag(sonuc, 532, 'son'), null);
  assert.equal(sonuc.satirlar.find((satir) => satir.ogrenci === 526).ucOlcumTam, true);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'belirsiz-kod'), []);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'kod-destegi'), [{ tur: 'kod-destegi', olcum: 'son', ogrenci: 526, form: 532, digerOgrenciler: [], digerFormlar: [504], destekOlcumleri: ['kal'] }]);
  assert.deepEqual(sonuc.eslesmeyenler.map((kagit) => [kagit.olcum, kagit.formNo]), [['son', 504]]);
});

test('Diğer ölçümdeki kod da ayırt etmiyorsa kâğıt bağlanmaz ve uyarı kalır', () => {
  const sonuc = olcumleriBirlestir([...form('on', 526, '05042707'), ...form('son', 504, '05040767'), ...form('son', 532, '06042702'), ...form('kal', 510, '05042707')]);
  assert.equal(bag(sonuc, 526, 'son'), null);
  assert.deepEqual(bag(sonuc, 526, 'kal'), [510, 'kod']);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'belirsiz-kod').map((uyari) => [uyari.olcum, uyari.ogrenciler, uyari.formlar]), [['son', [526], [504, 532]]]);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'kod-destegi'), []);
});

test('Aynı kâğıda eşit yakın iki öğrenciden, diğer ölçümdeki kodu uyan öğrenciye bağlanır', () => {
  const sonuc = olcumleriBirlestir([
    ...form('on', 601, '05042707'), ...form('on', 602, '06042702'), ...form('son', 700, '06042707'),
    ...form('kal', 801, '06042707'), ...form('kal', 802, '06042702'),
  ]);
  assert.deepEqual(bag(sonuc, 601, 'kal'), [801, 'yakin']);
  assert.deepEqual(bag(sonuc, 602, 'kal'), [802, 'kod']);
  assert.deepEqual(bag(sonuc, 601, 'son'), [700, 'yakin']);
  assert.equal(bag(sonuc, 602, 'son'), null);
  assert.deepEqual(sonuc.uyarilar.filter((uyari) => uyari.tur === 'kod-destegi'), [{ tur: 'kod-destegi', olcum: 'son', ogrenci: 601, form: 700, digerOgrenciler: [602], digerFormlar: [], destekOlcumleri: ['kal'] }]);
});

test('Eşit yakınlıkta kalan öğrenciye daha uzak üçüncü kâğıt bağlanmaz', () => {
  const sonuc = olcumleriBirlestir([...form('on', 526, '05042707'), ...form('son', 504, '05042717'), ...form('son', 532, '05042706'), ...form('son', 540, '05042799')]);
  assert.equal(bag(sonuc, 526, 'son'), null);
  assert.equal(sonuc.uyarilar.filter((uyari) => uyari.tur === 'belirsiz-kod').length, 1);
  assert.deepEqual(sonuc.eslesmeyenler.map((kagit) => kagit.formNo), [504, 532, 540]);
});

test('Aynı tam kod birden fazla kâğıtta ise kodla eşleştirme yapılmaz', () => {
  const sonuc = olcumleriBirlestir([...form('on', 510, '05050101'), ...form('on', 511, '05050101'), ...form('son', 600, '05050101')]);
  assert.equal(bag(sonuc, 510, 'son'), null);
  assert.equal(bag(sonuc, 511, 'son'), null);
  assert.equal(sonuc.uyarilar.filter((uyari) => uyari.tur === 'ayni-kod').length, 1);
});

test('Kodla eşleşmeyen öğrenciye aynı numaralı kâğıt yalnız başkası almadıysa bağlanır', () => {
  const sonuc = olcumleriBirlestir([
    ...form('on', 522, '05031702'), ...form('son', 522, null, { sinif: null, cins: null, yanit: null }), ...form('kal', 522, '05060111'),
    ...form('on', 537, '05061901'), ...form('son', 534, '05061901'),
    ...form('on', 534, null, { sinif: null, cins: null, yanit: null }),
  ]);
  assert.deepEqual(bag(sonuc, 522, 'son'), [522, 'numara']);
  assert.deepEqual(bag(sonuc, 522, 'kal'), [522, 'numara']);
  assert.deepEqual(bag(sonuc, 537, 'son'), [534, 'kod']);
  assert.equal(bag(sonuc, 534, 'son'), null);
  assert.equal(sonuc.satirlar.find((satir) => satir.ogrenci === 522).ucOlcumTam, false);
  for (const yol of ['kendi', 'kod', 'yakin', 'numara']) assert.ok(eslesmeYollari[yol].etiket);
});

test('Eksik ve mükerrer sayfa uyarı üretir, eksik sayfanın maddeleri boş sayılır', () => {
  const sonuc = olcumleriBirlestir([
    okunmusSayfa({ olcum: 'on', formNo: 539, sayfaNo: 1, kod: hane('05051711'), yanit: 4 }),
    okunmusSayfa({ olcum: 'on', formNo: 539, sayfaNo: 1, kod: hane('01010101'), yanit: 1, dosya: 'ikinci.pdf', pdfSayfasi: 9 }),
  ]);
  assert.deepEqual(sonuc.uyarilar.map((uyari) => uyari.tur).sort(), ['eksik-sayfa', 'mukerrer']);
  assert.deepEqual(sonuc.uyarilar.find((uyari) => uyari.tur === 'mukerrer').pdfSayfasi, 9);
  const satir = sonuc.satirlar[0];
  assert.equal(kodMetni(satir.kod), '05051711');
  const tablo = veriTablosu(sonuc.satirlar, 'ACI');
  assert.equal(tablo.satirlar[0][tablo.basliklar.indexOf('BSB1_on')], 4);
  assert.equal(tablo.satirlar[0][tablo.basliklar.indexOf('FOY1_on')], -99);
});

test('Veri tablosu örnek CSV düzenindedir: 315 sütun, -99 ve boş ölçüm', () => {
  const sonuc = olcumleriBirlestir([
    ...form('on', 504, '06092911', { cins: 2, yanit: (ad) => (ad === 'BSB2' ? 'cift' : ad === 'BSB3' ? null : 5) }),
    ...form('son', 601, '06092911', { yanit: 2 }),
    ...form('on', 510, null, { sinif: null, cins: null, yanit: null }),
  ]);
  const tablo = veriTablosu(sonuc.satirlar, 'ACI');
  assert.equal(tablo.basliklar.length, 6 + 3 * maddeler.length);
  assert.deepEqual(tablo.basliklar.slice(0, 7), ['ogrenci', 'okul', 'sinif', 'cins', 'uc_olcum_tam', 'kod_celiskisi', 'BSB1_on']);
  assert.equal(tablo.basliklar.at(-1), 'YZT21_kal');
  const [ilk, ikinci] = tablo.satirlar;
  assert.deepEqual(ilk.slice(0, 9), [504, 'ACI', 10, 2, 0, 1, 5, -99, -99]);
  assert.equal(ilk[tablo.basliklar.indexOf('BSB1_son')], 2);
  assert.equal(ilk[tablo.basliklar.indexOf('BSB1_kal')], '');
  assert.deepEqual(ikinci.slice(0, 7), [510, 'ACI', -99, -99, 0, 1, -99]);
  assert.ok(tablo.satirlar.every((satir) => satir.length === 315));
});

test('CSV metni BOM, noktalı virgül ve CRLF ile yazılır', () => {
  const metin = csvMetni(['ogrenci', 'okul'], [[504, 'ACI'], [505, 'A;B']]);
  assert.equal(metin, '﻿ogrenci;okul\r\n504;ACI\r\n505;"A;B"\r\n');
});
