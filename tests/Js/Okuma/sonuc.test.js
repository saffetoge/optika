import test from 'node:test';
import assert from 'node:assert/strict';
import { okulKoduOner, okulKodunuDuzenle, okumaSonucuKur, sonucSurumu, tamOlanlarTablosu, veriDosyalari } from '../../../resources/js/okuma-sonucu.js';
import { sonucuKaydet, sonucuOku, sonucuSil } from '../../../resources/js/sonuc-deposu.js';
import { cinsiyetEtiketi, olcumAdi } from '../../../resources/js/form-sablonu.js';
import { hane, okunmusForm } from './yardimci.js';

function bellek(sinir = Infinity) {
  const kayitlar = new Map();
  return {
    setItem: (anahtar, veri) => { if (veri.length > sinir) throw new Error('kota'); kayitlar.set(anahtar, veri); },
    getItem: (anahtar) => kayitlar.get(anahtar) ?? null,
    removeItem: (anahtar) => kayitlar.delete(anahtar),
  };
}

function dosya(ad, formlar, ekSayfalar = []) {
  const sayfalar = formlar.flat().map((okuma, sira) => ({ pdfSayfasi: sira + 1, okuma, resim: null }));
  return { ad, sayfalar: [...sayfalar, ...ekSayfalar.map((okuma, sira) => ({ pdfSayfasi: sayfalar.length + sira + 1, okuma, resim: 'data:image/jpeg;base64,AAAA' }))] };
}

function ornekSonuc() {
  return okumaSonucuKur({
    okul: 'ACI',
    profilSurumu: 'test',
    tarih: '2026-11-12T10:00:00.000Z',
    dosyalar: [
      dosya('açı ön test.pdf', [okunmusForm({ olcum: 'on', formNo: 506, kod: hane('06050711'), sinif: 10, cins: 1, yanit: 4 }), okunmusForm({ olcum: 'on', formNo: 508, kod: hane('00______'), sinif: 10, cins: 2, yanit: 2 })], [{ taninan: false, neden: 'kose' }]),
      dosya('açı son test.pdf', [okunmusForm({ olcum: 'son', formNo: 507, kod: hane('06050711'), yanit: 5 }).map((okuma, sira) => (sira ? { ...okuma, olcum: null } : okuma))]),
      dosya('açı kalıcılık.pdf', [okunmusForm({ olcum: 'kal', formNo: 537, kod: hane('06050711'), yanit: 3 }), okunmusForm({ olcum: 'kal', formNo: 530, kod: hane('07050205'), yanit: 1 })]),
    ],
  });
}

test('Okul kodu dosya adlarının ortak başından önerilir ve Türkçe harfler sadeleşir', () => {
  assert.equal(okulKoduOner(['açı ön test.pdf', 'açı son test.pdf', 'açı kalıcılık.pdf']), 'ACI');
  assert.equal(okulKoduOner(['açı ön test.pdf'.normalize('NFD'), 'açı son test.pdf'.normalize('NFD')]), 'ACI');
  assert.equal(okulKoduOner(['Şehit Öğretmen ön test.PDF', 'şehit öğretmen son test.pdf']), 'SEHIT_OGRETMEN');
  assert.equal(okulKoduOner(['açı ön test.pdf']), 'ACI');
  assert.equal(okulKoduOner(['ön test.pdf', 'son test.pdf']), '');
  assert.equal(okulKoduOner([]), '');
  assert.equal(okulKodunuDuzenle('  ığdır çş-1; '), 'IGDIR_CS-1');
});

test('Sonuç: tanınmayan sayfa ayrılır, başlığı okunamayan sayfa dosyanın ölçümüne sayılır', () => {
  const sonuc = ornekSonuc();
  assert.deepEqual(sonuc.ayrilanlar.map((kayit) => [kayit.dosya, kayit.pdfSayfasi, kayit.neden, Boolean(kayit.resim)]), [['açı ön test.pdf', 5, 'kose', true]]);
  assert.deepEqual(sonuc.uyarilar.map((uyari) => [uyari.tur, uyari.dosya, uyari.pdfSayfasi, uyari.olcum]), [['olcum-tahmini', 'açı son test.pdf', 2, 'son']]);
  assert.deepEqual(sonuc.dosyalar.map((kayit) => [kayit.sayfaSayisi, kayit.okunan, kayit.ayrilan, kayit.olcumler]), [[5, 4, 1, { on: 4 }], [2, 2, 0, { son: 2 }], [4, 4, 0, { kal: 4 }]]);
  const [ilk, ikinci] = sonuc.ogrenciler;
  assert.deepEqual([ilk.ogrenci, ilk.kod, ilk.sinif, ilk.cins, ilk.ucOlcumTam], [506, '06050711', 10, 1, true]);
  assert.deepEqual([ilk.olcumler.son.formNo, ilk.olcumler.son.yol, ilk.olcumler.kal.formNo, ilk.olcumler.kal.isaretli], [507, 'kod', 537, 103]);
  assert.deepEqual(ilk.olcumler.son.sayfalar.map((sayfa) => [sayfa.dosya, sayfa.pdfSayfasi]), [['açı son test.pdf', 1], ['açı son test.pdf', 2]]);
  assert.deepEqual([ikinci.ogrenci, ikinci.ucOlcumTam, ikinci.olcumler.son, ikinci.olcumler.kal], [508, false, null, null]);
  assert.deepEqual(sonuc.eslesmeyenler.map((kagit) => [kagit.olcum, kagit.formNo, kagit.kod]), [['kal', 530, '07050205']]);
});

test('Başlığı hiç okunamayan dosyanın sayfaları ölçümü bilinmediği için ayrılır', () => {
  const sayfalar = okunmusForm({ olcum: null, formNo: 600, kod: hane('01020304'), yanit: 1 });
  const sonuc = okumaSonucuKur({ okul: 'X', profilSurumu: 'test', tarih: '2026-11-12T10:00:00.000Z', dosyalar: [dosya('adsız.pdf', [sayfalar])] });
  assert.deepEqual(sonuc.ayrilanlar.map((kayit) => kayit.neden), ['olcum', 'olcum']);
  assert.equal(sonuc.ogrenciler.length, 0);
});

test('Ön test kâğıdı yoksa tablo boş kalır ve nedeni bildirilir', () => {
  const sonuc = okumaSonucuKur({ okul: 'X', profilSurumu: 'test', tarih: '2026-11-12T10:00:00.000Z', dosyalar: [dosya('son.pdf', [okunmusForm({ olcum: 'son', formNo: 600, kod: hane('01020304'), yanit: 1 })])] });
  assert.equal(sonuc.tablo.satirlar.length, 0);
  assert.deepEqual(sonuc.uyarilar.map((uyari) => uyari.tur), ['ilk-olcum-yok']);
});

test('İki veri dosyası okul koduyla adlandırılır; ikincisi yalnız üç ölçümü tam olanlardır', () => {
  const sonuc = ornekSonuc();
  const [tum, tam] = veriDosyalari(sonuc);
  assert.deepEqual([tum.ad, tam.ad], ['ACI_TUM_VERI.csv', 'ACI_UC_OLCUM_TAM.csv']);
  assert.deepEqual(tum.tablo.satirlar.map((satir) => satir[0]), [506, 508]);
  assert.deepEqual(tam.tablo.satirlar.map((satir) => satir[0]), [506]);
  assert.deepEqual(tamOlanlarTablosu(sonuc.tablo).basliklar, sonuc.tablo.basliklar);
});

test('Sonuç tarayıcıda saklanır, geri okunur ve silinir; bozuk ya da eski kayıt boş döner', () => {
  const depo = bellek();
  const sonuc = ornekSonuc();
  assert.equal(sonucuKaydet(sonuc, depo), true);
  assert.deepEqual(sonucuOku(depo), JSON.parse(JSON.stringify(sonuc)));
  assert.equal(sonucuSil(depo), true);
  assert.equal(sonucuOku(depo), null);
  depo.setItem('optika.okuma-sonucu.v1', JSON.stringify({ ...sonuc, surum: sonucSurumu + 1 }));
  assert.equal(sonucuOku(depo), null);
  assert.equal(sonucuOku({ getItem: () => '{' }), null);
  assert.equal(sonucuOku({ getItem: () => { throw new Error(); } }), null);
});

test('Depo dolarsa küçük görüntüler bırakılarak kaydedilir, yine sığmazsa başarısız döner', () => {
  const sonuc = ornekSonuc();
  sonuc.ayrilanlar[0].resim = 'x'.repeat(200000);
  const dar = bellek(190000);
  assert.equal(sonucuKaydet(sonuc, dar), true);
  assert.equal(sonucuOku(dar).ayrilanlar[0].resim, null);
  assert.equal(sonucuKaydet(sonuc, bellek(10)), false);
});

test('Ham değerler Türkçe etikete çevrilir, bilinmeyen değer genel metin alır', () => {
  assert.deepEqual([cinsiyetEtiketi(1), cinsiyetEtiketi(2), cinsiyetEtiketi(null)], ['Kız', 'Erkek', 'Belirtilmemiş']);
  assert.deepEqual([olcumAdi('on'), olcumAdi('son'), olcumAdi('kal'), olcumAdi('x')], ['Ön test', 'Son test', 'Kalıcılık testi', 'Belirtilmemiş']);
});
