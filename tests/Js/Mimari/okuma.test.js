import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const betikler = readdirSync('resources/js').filter((ad) => ad.endsWith('.js'));
const oku = (ad) => readFileSync(join('resources/js', ad), 'utf8');

test('Okuma eşikleri ve form ölçüleri merkez dışında yazılmaz', () => {
  for (const ad of ['optik-okuyucu.js', 'hizalama.js', 'olcum-birlestirme.js', 'okuma-sonucu.js', 'okuma.js', 'sonuclar-sayfasi.js', 'sonuc-deposu.js', 'csv.js']) {
    assert.doesNotMatch(oku(ad), /\b\d+\.\d+\b/, ad);
  }
  assert.match(oku('okuma-profili.js'), /isaretEsigi:\s*\d/);
  assert.match(oku('form-sablonu.js'), /balonYaricapi:\s*\d/);
  assert.match(oku('optik-okuyucu.js'), /parametreler\.isaretEsigi/);
  assert.match(oku('okuma.js'), /durum\.aktifKalibrasyon\.parametreler/);
});

test('Eşleştirme kuralı ve boş değer tek yerde tanımlıdır', () => {
  for (const ad of betikler.filter((dosya) => dosya !== 'olcum-birlestirme.js')) {
    assert.doesNotMatch(oku(ad), /enCokCelisenHane|enAzOrtakHane/, ad);
  }
  for (const ad of betikler.filter((dosya) => dosya !== 'form-sablonu.js')) {
    assert.doesNotMatch(oku(ad), /-99/, ad);
  }
});

test('Yüklenen PDF ve sonuçlar dışarı gönderilmez', () => {
  for (const ad of betikler) {
    assert.doesNotMatch(oku(ad), /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|<form\b/, ad);
  }
});

test('Sonuç sayfası ham değerleri etiket merkezlerinden çevirir ve metni güvenli yazar', () => {
  const kod = oku('sonuclar-sayfasi.js');
  for (const merkez of ['eslesmeYollari[', 'taninmamaNedenleri[', 'olcumAdi(', 'cinsiyetEtiketi(']) assert.ok(kod.includes(merkez), merkez);
  assert.doesNotMatch(kod, /innerHTML|insertAdjacentHTML|outerHTML/);
  assert.doesNotMatch(oku('okuma.js'), /innerHTML|insertAdjacentHTML|outerHTML/);
});

test('Taranmış PDF çözücüleri derlemeye eklenir ve PDF modülü onları kullanır', () => {
  const derleme = readFileSync('vite.config.js', 'utf8');
  assert.match(derleme, /jbig2\.wasm/);
  assert.match(derleme, /pdf-cozuculeri\//);
  assert.match(oku('pdf.js'), /wasmUrl:\s*`\$\{import\.meta\.env\.BASE_URL\}pdf-cozuculeri\/`/);
});
