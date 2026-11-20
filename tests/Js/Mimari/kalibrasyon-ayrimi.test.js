import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kalibrasyonAdayiniKaydet, okuyucuDurumunuOku, okumaEngeli } from '../../../resources/js/kalibrasyon-durumu.js';
import { okumaProfili } from '../../../resources/js/okuma-profili.js';

function bellek() {
  const kayitlar = new Map();
  return { setItem: (anahtar, veri) => kayitlar.set(anahtar, veri), getItem: (anahtar) => kayitlar.get(anahtar) ?? null };
}

test('Yüklenen aday yenileme sonrasında korunur ancak etkin okuma ayarını değiştirmez', () => {
  const depo = bellek();
  assert.equal(kalibrasyonAdayiniKaydet({ ad: 'KAL.pdf', sayfaSayisi: 1 }, depo), true);
  const durum = okuyucuDurumunuOku(depo);
  assert.deepEqual(durum.aday, { ad: 'KAL.pdf', sayfaSayisi: 1 });
  assert.equal(durum.aktifKalibrasyon, okumaProfili);
  assert.equal(okuyucuDurumunuOku(bellek()).aktifKalibrasyon, okumaProfili);
  assert.equal(durum.motorHazir, true);
  assert.match(okumaEngeli(durum, 0), /en az bir geçerli test PDF/);
  assert.equal(okumaEngeli(durum, 2), null);
});

test('Tarayıcıya yazılmış sahte doğrulama etkin okuma ayarına dönüşmez', () => {
  const depo = bellek();
  depo.setItem('optika.kalibrasyon-adayi.v1', JSON.stringify({ ad: 'örnek.pdf', sayfaSayisi: 1, dogrulandi: true, surum: '1', parametreler: { ornek: true, isaretEsigi: 0.9 } }));
  const durum = okuyucuDurumunuOku(depo);
  assert.equal(durum.aktifKalibrasyon, okumaProfili);
  assert.notEqual(durum.aktifKalibrasyon.surum, '1');
  assert.equal(durum.aktifKalibrasyon.parametreler.ornek, undefined);
  assert.notEqual(durum.aktifKalibrasyon.parametreler.isaretEsigi, 0.9);
});

test('Yerleşik okuma ayarı doğrulanmış, sürümlü ve değiştirilemezdir', () => {
  assert.equal(okumaProfili.dogrulandi, true);
  assert.match(okumaProfili.surum, /^\d{4}\.\d{2}-\d+$/);
  assert.ok(Object.isFrozen(okumaProfili) && Object.isFrozen(okumaProfili.parametreler));
  for (const ad of ['sayfaGenisligi', 'isaretEsigi', 'ciftIsaretOrani', 'silikIsaretEsigi', 'halkaUyumEsigi', 'seritDoluEsigi', 'seritBosEsigi']) {
    assert.equal(typeof okumaProfili.parametreler[ad], 'number', ad);
  }
  assert.equal(okumaEngeli({ aktifKalibrasyon: okumaProfili, motorHazir: true }, 1), null);
});

test('Okuma kapısı doğrulama, motor ve geçerli dosyayı birlikte gerektirir', () => {
  const profil = { dogrulandi: true, surum: 'test-surumu', parametreler: { test: true } };
  assert.ok(okumaEngeli({ aktifKalibrasyon: null, motorHazir: true }, 1));
  assert.ok(okumaEngeli({ aktifKalibrasyon: { ...profil, parametreler: {} }, motorHazir: true }, 1));
  assert.ok(okumaEngeli({ aktifKalibrasyon: profil, motorHazir: false }, 1));
  assert.ok(okumaEngeli({ aktifKalibrasyon: profil, motorHazir: true }, 0));
  assert.equal(okumaEngeli({ aktifKalibrasyon: profil, motorHazir: true }, 1), null);
});

test('Bozuk veya erişilemeyen yerel kayıt güvenli biçimde boş duruma döner', () => {
  assert.equal(okuyucuDurumunuOku({ getItem: () => '{' }).aday, null);
  assert.equal(okuyucuDurumunuOku({ getItem: () => { throw new Error(); } }).aday, null);
  assert.equal(kalibrasyonAdayiniKaydet({ ad: 'KAL.pdf', sayfaSayisi: 1 }, { setItem: () => { throw new Error(); } }), false);
});

test('PDF okuma örnek kalibrasyon sonuçlarını içe aktarmaz', () => {
  for (const yol of ['resources/js/okuma.js', 'resources/js/okuma-sayfasi.js', 'resources/js/optik-okuyucu.js', 'resources/js/olcum-birlestirme.js', 'resources/js/okuma-sonucu.js', 'resources/js/sonuclar-sayfasi.js', 'resources/js/sonuc-deposu.js']) {
    assert.doesNotMatch(readFileSync(yol, 'utf8'), /ornekSonuclar|kalibrasyon-sonuclari/);
  }
  assert.match(readFileSync('resources/js/okuma.js', 'utf8'), /okumaEngeli\(okuyucuDurumunuOku\(\)/);
});
