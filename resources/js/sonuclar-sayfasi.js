import { bildir, dosyaIndir } from './ortak';
import { csvMetni } from './csv';
import { cinsiyetEtiketi, kodHaneSayisi, olcumAdi, olcumler } from './form-sablonu';
import { eslesmeYollari } from './olcum-birlestirme';
import { taninmamaNedenleri } from './optik-okuyucu';
import { veriDosyalari } from './okuma-sonucu';
import { sonucuOku, sonucuSil } from './sonuc-deposu';

function oge(etiket, sinif, metin) {
  const yeni = document.createElement(etiket);
  if (sinif) yeni.className = sinif;
  if (metin !== undefined) yeni.textContent = metin;
  return yeni;
}

function sayfaKaynagi(sayfalar) {
  const gruplar = new Map();
  for (const sayfa of sayfalar) gruplar.set(sayfa.dosya, [...(gruplar.get(sayfa.dosya) ?? []), sayfa.pdfSayfasi]);
  return [...gruplar].map(([dosya, numaralar]) => `${dosya}, sayfa ${numaralar.sort((a, b) => a - b).join(' ve ')}`).join(' · ');
}

function uyariMetni(uyari) {
  const olcum = olcumAdi(uyari.olcum);
  if (uyari.tur === 'belirsiz-kod') return `${olcum}: ${uyari.ogrenciler.join(', ')} numaralı öğrenci için ${uyari.formlar.join(' ve ')} numaralı kâğıtlar eşit yakınlıkta. Hiçbiri bağlanmadı; kişisel kod kutularına bakarak karar verin.`;
  if (uyari.tur === 'kod-destegi') {
    const digerAdaylar = [uyari.digerFormlar.length ? `${uyari.digerFormlar.join(', ')} numaralı kâğıt` : null, uyari.digerOgrenciler.length ? `${uyari.digerOgrenciler.join(', ')} numaralı öğrenci` : null].filter(Boolean).join('; ');
    const destek = uyari.destekOlcumleri.map((kod) => olcumAdi(kod).toLocaleLowerCase('tr')).join(' ve ');
    return `${olcum}: ${uyari.ogrenci} numaralı öğrenciye ${uyari.form} numaralı kâğıt bağlandı. Eşit yakınlıkta başka aday vardı (${digerAdaylar}); karar öğrencinin ${destek} kâğıdındaki koda göre verildi. Kişisel kod kutularına bakarak doğrulayın.`;
  }
  if (uyari.tur === 'ayni-kod') return `${olcum}: ${uyari.kod} kodu birden fazla kâğıtta var (öğrenci ${uyari.ogrenciler.join(', ')}; kâğıt ${uyari.formlar.join(', ')}). Bu kodla eşleştirme yapılmadı.`;
  if (uyari.tur === 'mukerrer') return `${olcum}, form ${uyari.formNo}: ${uyari.sayfaNo}. sayfa birden fazla taranmış. ${uyari.dosya}, sayfa ${uyari.pdfSayfasi} kullanılmadı.`;
  if (uyari.tur === 'eksik-sayfa') return `${olcum}, form ${uyari.formNo}: ${uyari.sayfaNo}. sayfa bulunamadı. O sayfadaki maddeler boş sayıldı.`;
  if (uyari.tur === 'olcum-tahmini') return `${uyari.dosya}, sayfa ${uyari.pdfSayfasi}: ölçüm başlığı okunamadı; dosyadaki diğer sayfalara göre ${olcum} sayıldı.`;
  if (uyari.tur === 'ilk-olcum-yok') return `${olcum} kâğıdı bulunamadı. Öğrenci satırları ${olcum.toLocaleLowerCase('tr')} kâğıtlarından kurulduğu için tablo boş kaldı.`;
  return 'Belirtilmemiş uyarı.';
}

function olcumHucresi(kayit, ilk) {
  const hucre = document.createElement('td');
  if (!kayit) { hucre.append(oge('span', 'etiket', 'Yok')); return hucre; }
  const yol = eslesmeYollari[kayit.yol] ?? { etiket: 'Belirtilmemiş', renk: '' };
  const ust = oge('div', 'hucre-ust');
  ust.append(oge('strong', null, `Form ${kayit.formNo}`));
  if (!ilk) ust.append(oge('span', `etiket ${yol.renk}`, yol.etiket));
  const ayrintilar = [`${kayit.isaretli} madde işaretli`];
  if (kayit.cift) ayrintilar.push(`${kayit.cift} çift işaret`);
  if (!ilk) ayrintilar.unshift(`Kod ${kayit.kod}`);
  if (kayit.yol === 'yakin') {
    const bos = kodHaneSayisi - kayit.ortak - kayit.celisen;
    ayrintilar.push([kayit.celisen ? `${kayit.celisen} hane farklı` : null, bos ? `${bos} hane okunamadı` : null].filter(Boolean).join(', '));
  }
  hucre.append(ust, oge('small', 'hucre-alt', ayrintilar.join(' · ')));
  return hucre;
}

function ogrencileriGoster(sonuc, filtre) {
  const liste = sonuc.ogrenciler.filter((ogrenci) => filtre === 'tumu' || (filtre === 'tam' ? ogrenci.ucOlcumTam : !ogrenci.ucOlcumTam));
  document.querySelector('#ogrenci-satirlari').replaceChildren(...liste.map((ogrenci) => {
    const satir = document.createElement('tr');
    const durum = document.createElement('td');
    durum.append(oge('span', `etiket ${ogrenci.ucOlcumTam ? 'yesil' : 'turuncu'}`, ogrenci.ucOlcumTam ? 'Üç ölçüm tam' : 'Tam değil'));
    satir.append(
      oge('td', null, ogrenci.ogrenci),
      oge('td', 'kod-hucresi', ogrenci.kod),
      oge('td', null, ogrenci.sinif ?? 'Belirtilmemiş'),
      oge('td', null, cinsiyetEtiketi(ogrenci.cins)),
      ...olcumler.map((olcum, sira) => olcumHucresi(ogrenci.olcumler[olcum.kod], sira === 0)),
      durum,
    );
    return satir;
  }));
  document.querySelector('#ogrenci-bos').hidden = liste.length > 0;
}

function goster(sonuc) {
  document.querySelector('#sonuc-yok').hidden = true;
  document.querySelector('#sonuc-var').hidden = false;
  const tam = sonuc.ogrenciler.filter((ogrenci) => ogrenci.ucOlcumTam).length;
  const kartlar = [['Öğrenci (ön test kâğıdı)', sonuc.ogrenciler.length], ['Üç ölçümü tam', tam], ['Eşleşmeyen kâğıt', sonuc.eslesmeyenler.length], ['Ayrılan sayfa', sonuc.ayrilanlar.length]];
  document.querySelector('#okuma-ozeti').replaceChildren(...kartlar.map(([baslik, deger]) => {
    const kart = oge('div', 'kart');
    kart.append(oge('span', null, baslik), oge('strong', null, deger));
    return kart;
  }));
  const toplamSayfa = sonuc.dosyalar.reduce((toplam, dosya) => toplam + dosya.sayfaSayisi, 0);
  document.querySelector('#sonuc-basligi').textContent = `${sonuc.okul} okulu veri dosyaları`;
  document.querySelector('#sonuc-aciklamasi').textContent = `${new Date(sonuc.tarih).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} · ${sonuc.dosyalar.length} PDF, ${toplamSayfa} sayfa · Okuma ayarı sürüm ${sonuc.profilSurumu} · ${sonuc.isaretOzeti.silik} silik işaret okundu, ${sonuc.isaretOzeti.cift} çift işaret boş sayıldı.`;
  const [tumVeri, tamVeri] = veriDosyalari(sonuc);
  document.querySelector('#tum-veri-adi').textContent = `${tumVeri.ad} · ${tumVeri.tablo.satirlar.length} öğrenci`;
  document.querySelector('#tam-veri-adi').textContent = `${tamVeri.ad} · ${tamVeri.tablo.satirlar.length} öğrenci`;
  document.querySelector('#tum-veri-indir').addEventListener('click', () => dosyaIndir(tumVeri.ad, csvMetni(tumVeri.tablo.basliklar, tumVeri.tablo.satirlar), 'text/csv;charset=utf-8'));
  document.querySelector('#tam-veri-indir').addEventListener('click', () => dosyaIndir(tamVeri.ad, csvMetni(tamVeri.tablo.basliklar, tamVeri.tablo.satirlar), 'text/csv;charset=utf-8'));

  document.querySelector('#dosya-ozeti').replaceChildren(...sonuc.dosyalar.map((dosya) => {
    const satir = document.createElement('tr');
    const dagilim = Object.entries(dosya.olcumler).map(([kod, adet]) => `${olcumAdi(kod)} · ${adet} sayfa`).join(', ');
    satir.append(oge('td', 'dosya-adi', dosya.ad), oge('td', null, dosya.sayfaSayisi), oge('td', null, dagilim || 'Cevap kâğıdı bulunamadı'), oge('td', null, dosya.ayrilan));
    return satir;
  }));

  document.querySelector('#kontrol-karti').hidden = sonuc.uyarilar.length === 0;
  document.querySelector('#kontrol-sayisi').textContent = `${sonuc.uyarilar.length} madde`;
  document.querySelector('#kontrol-listesi').replaceChildren(...sonuc.uyarilar.map((uyari) => oge('li', null, uyariMetni(uyari))));

  ogrencileriGoster(sonuc, 'tumu');
  document.querySelectorAll('[data-ogrenci-filtresi]').forEach((dugme) => dugme.addEventListener('click', () => {
    document.querySelectorAll('[data-ogrenci-filtresi]').forEach((diger) => diger.classList.toggle('etkin', diger === dugme));
    ogrencileriGoster(sonuc, dugme.dataset.ogrenciFiltresi);
  }));

  document.querySelector('#eslesmeyen-karti').hidden = sonuc.eslesmeyenler.length === 0;
  document.querySelector('#eslesmeyen-sayisi').textContent = `${sonuc.eslesmeyenler.length} kâğıt`;
  document.querySelector('#eslesmeyen-satirlari').replaceChildren(...sonuc.eslesmeyenler.map((form) => {
    const satir = document.createElement('tr');
    satir.append(oge('td', null, olcumAdi(form.olcum)), oge('td', null, form.formNo), oge('td', 'kod-hucresi', form.kod), oge('td', null, form.isaretli), oge('td', 'dosya-adi', sayfaKaynagi(form.sayfalar)));
    return satir;
  }));

  document.querySelector('#ayrilan-karti').hidden = sonuc.ayrilanlar.length === 0;
  document.querySelector('#ayrilan-sayisi').textContent = `${sonuc.ayrilanlar.length} sayfa`;
  document.querySelector('#ayrilan-listesi').replaceChildren(...sonuc.ayrilanlar.map((kayit) => {
    const kutu = oge('figure', 'ayrilan-sayfa');
    if (kayit.resim) {
      const resim = document.createElement('img');
      resim.src = kayit.resim;
      resim.alt = `${kayit.dosya}, sayfa ${kayit.pdfSayfasi} küçük görüntüsü`;
      kutu.append(resim);
    } else kutu.append(oge('div', 'resim-yok', 'Görüntü saklanmadı'));
    const aciklama = document.createElement('figcaption');
    aciklama.append(oge('strong', null, `${kayit.dosya} · sayfa ${kayit.pdfSayfasi}`), oge('span', null, taninmamaNedenleri[kayit.neden] ?? 'Belirtilmemiş'));
    kutu.append(aciklama);
    return kutu;
  }));
}

const sonuc = sonucuOku();
if (sonuc) goster(sonuc);
document.querySelector('#sonuclari-temizle').addEventListener('click', () => {
  sonucuSil();
  document.querySelector('#sonuc-var').hidden = true;
  document.querySelector('#sonuc-yok').hidden = false;
  bildir('Sonuçlar bu tarayıcıdan silindi.');
});
