import { pdfAc, pdfKapat, pdfSayfaGri, sayfaKucukResmi } from './pdf';
import { okuyucuDurumunuOku, okumaEngeli } from './kalibrasyon-durumu';
import { sayfaOku } from './optik-okuyucu';
import { formSablonu } from './form-sablonu';
import { csvMetni } from './csv';
import { okumaSonucuKur, okulKoduOner, okulKodunuDuzenle, veriDosyalari } from './okuma-sonucu';
import { sonucuKaydet } from './sonuc-deposu';
import { dosyaIndir } from './ortak';

const kucukResimGenisligi = 220;

export function okumayiBaslat(bildir) {
  let dosyalar = [];
  let surum = 0;
  let okunuyor = false;
  let durdurmaIstendi = false;
  let onerilenOkul = '';
  const govde = document.querySelector('#dosya-satirlari');
  const baslat = document.querySelector('#okumayi-baslat');
  const okulGirdisi = document.querySelector('#okul-kodu');
  const ilerleme = document.querySelector('#okuma-ilerleme');
  const cubuk = document.querySelector('#okuma-cubugu');
  const ilerlemeMetni = document.querySelector('#okuma-ilerleme-metni');
  const okumaDurumu = document.querySelector('#okuma-durumu');
  const dosyaGirdisi = document.querySelector('#okuma-dosyalar');

  function gecerliler() {
    return dosyalar.filter((dosya) => dosya.sayfa > 0 && !dosya.hata);
  }

  function durumMetni(dosya) {
    if (dosya.hata) return dosya.hata;
    if (dosya.sayfa === null) return 'Sayfalar sayılıyor';
    if (dosya.okunan === null) return okunuyor ? 'Sırada' : 'Okunmaya hazır';
    if (dosya.okunan < dosya.sayfa) return `Okunuyor · ${dosya.okunan} / ${dosya.sayfa}`;
    return 'Okundu';
  }

  function listeyiGuncelle() {
    baslat.disabled = okunuyor || Boolean(okumaEngeli(okuyucuDurumunuOku(), gecerliler().length));
    document.querySelector('#pdf-sayisi').textContent = dosyalar.length;
    document.querySelector('#kuyruk-sayisi').textContent = dosyalar.length;
    document.querySelector('#toplam-sayfa').textContent = dosyalar.reduce((toplam, dosya) => toplam + (dosya.sayfa ?? 0), 0);
    document.querySelector('#kuyruk-bos').hidden = dosyalar.length > 0;
    document.querySelector('#kuyruk-temizle').disabled = okunuyor || dosyalar.length === 0;
    dosyaGirdisi.disabled = okunuyor;
    okulGirdisi.disabled = okunuyor;
    govde.replaceChildren(...dosyalar.map((dosya) => {
      const satir = document.createElement('tr');
      const ad = document.createElement('td');
      ad.className = 'dosya-adi';
      ad.textContent = dosya.ad;
      const sayfa = document.createElement('td');
      sayfa.textContent = dosya.hata ? 'Yok' : dosya.sayfa ?? 'Bekliyor';
      const durum = document.createElement('td');
      const etiket = document.createElement('span');
      etiket.className = `etiket ${dosya.hata ? 'turuncu' : dosya.okunan !== null && dosya.okunan === dosya.sayfa ? 'yesil' : 'mor'}`;
      etiket.textContent = durumMetni(dosya);
      durum.append(etiket);
      const islem = document.createElement('td');
      const sil = document.createElement('button');
      sil.className = 'metin-dugme';
      sil.textContent = 'Kaldır';
      sil.disabled = okunuyor;
      sil.setAttribute('aria-label', `${dosya.ad} dosyasını kaldır`);
      sil.addEventListener('click', () => { dosyalar = dosyalar.filter((kayit) => kayit !== dosya); okulOner(); listeyiGuncelle(); });
      islem.append(sil);
      satir.append(ad, sayfa, durum, islem);
      return satir;
    }));
  }

  function okulOner() {
    const oneri = okulKoduOner(dosyalar.filter((dosya) => !dosya.hata).map((dosya) => dosya.ad));
    if (okulGirdisi.value === '' || okulGirdisi.value === onerilenOkul) okulGirdisi.value = oneri;
    onerilenOkul = oneri;
  }

  async function dosyalariEkle(gelenler) {
    if (okunuyor) { bildir('Okuma sürerken dosya eklenemez.'); return; }
    const islemSurumu = surum;
    for (const dosya of gelenler) {
      if (surum !== islemSurumu) break;
      const kimlik = `${dosya.name}:${dosya.size}:${dosya.lastModified}`;
      if (dosyalar.some((kayit) => kayit.kimlik === kimlik)) { bildir(`${dosya.name} zaten listede.`); continue; }
      const kayit = { kimlik, ad: dosya.name, dosya, sayfa: null, hata: null, okunan: null };
      dosyalar.push(kayit);
      listeyiGuncelle();
      let belge;
      try {
        belge = await pdfAc(dosya);
        kayit.sayfa = belge.numPages;
      } catch (hata) { kayit.hata = hata.message; }
      finally { if (belge) await pdfKapat(belge); }
      if (surum === islemSurumu) { okulOner(); listeyiGuncelle(); }
    }
  }

  function ilerlemeyiGoster(biten, toplam, metin) {
    cubuk.max = toplam;
    cubuk.value = biten;
    ilerlemeMetni.textContent = metin;
  }

  async function sayfalariOku(kuyruk, parametreler) {
    const tuval = document.createElement('canvas');
    const toplam = kuyruk.reduce((sayi, dosya) => sayi + dosya.sayfa, 0);
    const okunanlar = [];
    let biten = 0;
    for (const kayit of kuyruk) {
      const belge = await pdfAc(kayit.dosya);
      const sayfalar = [];
      kayit.okunan = 0;
      try {
        for (let sayfaNo = 1; sayfaNo <= belge.numPages; sayfaNo++) {
          if (durdurmaIstendi) return null;
          const gri = await pdfSayfaGri(belge, sayfaNo, parametreler.sayfaGenisligi, tuval);
          const { donusum, ...okuma } = sayfaOku(gri, formSablonu, parametreler);
          const resim = okuma.taninan && okuma.olcum ? null : sayfaKucukResmi(tuval, kucukResimGenisligi);
          sayfalar.push({ pdfSayfasi: sayfaNo, okuma, resim });
          kayit.okunan = sayfaNo;
          biten++;
          ilerlemeyiGoster(biten, toplam, `${kayit.ad} · sayfa ${sayfaNo} / ${belge.numPages}`);
          if (sayfaNo % 5 === 0 || sayfaNo === belge.numPages) listeyiGuncelle();
        }
      } finally { await pdfKapat(belge); }
      okunanlar.push({ ad: kayit.ad, sayfalar });
    }
    return okunanlar;
  }

  async function oku() {
    const durum = okuyucuDurumunuOku();
    const kuyruk = gecerliler();
    const engel = okumaEngeli(durum, kuyruk.length);
    if (engel) { bildir(engel); return; }
    const okul = okulKodunuDuzenle(okulGirdisi.value);
    okulGirdisi.value = okul;
    if (!okul) { bildir('Okul kodunu yazın. Kod, CSV’deki okul sütununa ve dosya adına yazılır.'); okulGirdisi.focus(); return; }
    okunuyor = true;
    durdurmaIstendi = false;
    dosyalar.forEach((dosya) => { dosya.okunan = null; });
    ilerleme.hidden = false;
    okumaDurumu.textContent = 'Okunuyor';
    ilerlemeyiGoster(0, kuyruk.reduce((sayi, dosya) => sayi + dosya.sayfa, 0), 'Okuma başlıyor…');
    listeyiGuncelle();
    try {
      const okunanlar = await sayfalariOku(kuyruk, durum.aktifKalibrasyon.parametreler);
      if (!okunanlar) {
        dosyalar.forEach((dosya) => { dosya.okunan = null; });
        okumaDurumu.textContent = 'Durduruldu';
        bildir('Okuma durduruldu. Sonuç kaydedilmedi.');
        return;
      }
      const sonuc = okumaSonucuKur({ okul, dosyalar: okunanlar, profilSurumu: durum.aktifKalibrasyon.surum, tarih: new Date().toISOString() });
      okumaDurumu.textContent = 'Tamamlandı';
      if (sonucuKaydet(sonuc)) { location.assign('/sonuclar'); return; }
      for (const dosya of veriDosyalari(sonuc)) dosyaIndir(dosya.ad, csvMetni(dosya.tablo.basliklar, dosya.tablo.satirlar), 'text/csv;charset=utf-8');
      bildir('Sonuç tarayıcıya kaydedilemedi; CSV dosyaları doğrudan indirildi.');
    } catch {
      dosyalar.forEach((dosya) => { dosya.okunan = null; });
      okumaDurumu.textContent = 'Tamamlanamadı';
      bildir('Okuma tamamlanamadı. PDF dosyalarını yeniden ekleyip tekrar deneyin.');
    } finally {
      okunuyor = false;
      ilerleme.hidden = true;
      listeyiGuncelle();
    }
  }

  document.querySelector('#kuyruk-temizle').addEventListener('click', () => {
    surum++;
    dosyalar = [];
    okulOner();
    listeyiGuncelle();
  });
  document.querySelector('#okumayi-durdur').addEventListener('click', () => { durdurmaIstendi = true; });
  okulGirdisi.addEventListener('change', () => { okulGirdisi.value = okulKodunuDuzenle(okulGirdisi.value); });
  baslat.addEventListener('click', oku);
  listeyiGuncelle();
  return dosyalariEkle;
}
