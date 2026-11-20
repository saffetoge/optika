import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ornekSonuclar, sonucOzeti, durumlar } from '../../../resources/js/kalibrasyon.js';

function dosyalar(dizin) {
  return readdirSync(dizin, { withFileTypes: true }).flatMap((oge) => oge.isDirectory() ? dosyalar(join(dizin, oge.name)) : [join(dizin, oge.name)]);
}

test('Birinci taraf betiklerde eval ve iç ayrıntı yorumu yoktur', () => {
  for (const yol of dosyalar('resources/js')) {
    const kod = readFileSync(yol, 'utf8');
    assert.doesNotMatch(kod, /\beval\s*\(|new\s+Function\b|setTimeout\s*\(\s*['"]|\/\*|^\s*\/\//m, yol);
    assert.doesNotMatch(kod, /setAttribute\(\s*['"]on\w+|onclick\s*=/i, yol);
  }
});

test('Örnek veri tüm kalibrasyon satırlarını kapsar ve etiketler merkezidir', () => {
  assert.equal(ornekSonuclar.length, 20);
  assert.equal(new Set(ornekSonuclar.map((satir) => satir.satir)).size, 20);
  for (const satir of ornekSonuclar) {
    assert.ok(durumlar[satir.durum]);
    assert.ok(satir.secimler.every((secim) => secim >= 1 && secim <= 5));
  }
  assert.deepEqual(sonucOzeti([{ durum: 'kontrol', secimler: [] }, { durum: 'isaretli', secimler: [1] }]), { toplam: 2, kontrol: 1, bos: 1 });
});

test('PDF kaynağı kapatma işlemi yalnız PDF modülünden yürütülür', () => {
  for (const yol of dosyalar('resources/js').filter((yol) => !yol.endsWith('/pdf.js'))) {
    assert.doesNotMatch(readFileSync(yol, 'utf8'), /\.destroy\(/, yol);
  }
  assert.match(readFileSync('resources/js/pdf.js', 'utf8'), /belge\.loadingTask\.destroy\(\)/);
});

test('Üretilen her uyarı türünün sonuç sayfasında Türkçe metni vardır', () => {
  const uretilen = new Set(['olcum-birlestirme.js', 'okuma-sonucu.js'].flatMap((ad) => [...readFileSync(join('resources/js', ad), 'utf8').matchAll(/tur: '([a-z-]+)'/g)].map((eslesme) => eslesme[1])));
  const sayfa = readFileSync('resources/js/sonuclar-sayfasi.js', 'utf8');
  const metinli = new Set([...sayfa.matchAll(/uyari\.tur === '([a-z-]+)'/g)].map((eslesme) => eslesme[1]));
  assert.ok(uretilen.size >= 7, [...uretilen].join(', '));
  assert.deepEqual([...uretilen].filter((tur) => !metinli.has(tur)), []);
  assert.match(sayfa, /return 'Belirtilmemiş uyarı\.';/);
});
