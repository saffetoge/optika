import { pdfAc, pdfSayfaCiz, pdfKapat } from './pdf';
import { bildir, dosyaAlaniBagla } from './ortak';
import { sonuclariGoster, ornekVeriyiIndir } from './kalibrasyon-sonuclari';
import { kalibrasyonAdayiniKaydet } from './kalibrasyon-durumu';
import { ortakDurumuGoster } from './okuyucu-durumu';

let belge = null;
let sayfaNo = 1;
let kalibrasyonSurumu = 0;
let cizimSuruyor = false;
const tuval = document.querySelector('#pdf-tuvali');
const referansGorsel = document.querySelector('#referans-gorsel');
const dosyaBilgi = document.querySelector('#kalibrasyon-dosya-bilgi');

function sayfaDugmeleri() {
  document.querySelector('#onceki-sayfa').disabled = cizimSuruyor || !belge || sayfaNo <= 1;
  document.querySelector('#sonraki-sayfa').disabled = cizimSuruyor || !belge || sayfaNo >= belge.numPages;
  document.querySelector('#sayfa-bilgisi').textContent = `Sayfa ${sayfaNo} / ${belge?.numPages ?? 1}`;
}

async function kalibrasyonYukle(dosyalar) {
  const dosya = dosyalar[0];
  if (dosyalar.length > 1) { bildir('Kalibrasyon için tek bir PDF seçin.'); return; }
  const surum = ++kalibrasyonSurumu;
  dosyaBilgi.hidden = false;
  dosyaBilgi.textContent = 'PDF açılıyor…';
  let yeniBelge;
  try {
    yeniBelge = await pdfAc(dosya);
    const geciciTuval = document.createElement('canvas');
    await pdfSayfaCiz(yeniBelge, 1, geciciTuval);
    if (surum !== kalibrasyonSurumu) { await pdfKapat(yeniBelge); return; }
    const eskiBelge = belge;
    belge = yeniBelge;
    sayfaNo = 1;
    tuval.width = geciciTuval.width;
    tuval.height = geciciTuval.height;
    tuval.getContext('2d').drawImage(geciciTuval, 0, 0);
    if (eskiBelge) await pdfKapat(eskiBelge);
    referansGorsel.hidden = true;
    tuval.hidden = false;
    document.querySelector('#onizleme-adi').textContent = dosya.name;
    document.querySelector('#referans-etiketi').textContent = 'Yüklenen PDF · Optik doğrulanmadı';
    dosyaBilgi.textContent = `${dosya.name} · ${belge.numPages} sayfa · Önizleme hazır`;
    document.querySelectorAll('[data-referans]').forEach((dugme) => dugme.classList.remove('etkin'));
    document.querySelector('#adim-yukle').classList.add('etkin');
    kalibrasyonAdayiniKaydet({ ad: dosya.name, sayfaSayisi: belge.numPages });
    ortakDurumuGoster();
    sayfaDugmeleri();
  } catch (hata) {
    if (yeniBelge && yeniBelge !== belge) await pdfKapat(yeniBelge);
    if (surum !== kalibrasyonSurumu) return;
    dosyaBilgi.textContent = hata.message;
    bildir(hata.message);
  }
}
dosyaAlaniBagla('kalibrasyon-birak', 'kalibrasyon-dosya', kalibrasyonYukle);

async function sayfaDegistir(fark) {
  if (!belge || cizimSuruyor) return;
  const yeniNo = sayfaNo + fark;
  if (yeniNo < 1 || yeniNo > belge.numPages) return;
  cizimSuruyor = true;
  sayfaDugmeleri();
  const mevcutBelge = belge;
  const surum = kalibrasyonSurumu;
  try {
    const geciciTuval = document.createElement('canvas');
    await pdfSayfaCiz(mevcutBelge, yeniNo, geciciTuval);
    if (surum !== kalibrasyonSurumu) return;
    tuval.width = geciciTuval.width;
    tuval.height = geciciTuval.height;
    tuval.getContext('2d').drawImage(geciciTuval, 0, 0);
    sayfaNo = yeniNo;
  } catch { if (surum === kalibrasyonSurumu) bildir('Sayfa gösterilemedi. PDF’yi yeniden yükleyin.'); }
  finally { cizimSuruyor = false; sayfaDugmeleri(); }
}
document.querySelector('#onceki-sayfa').addEventListener('click', () => sayfaDegistir(-1));
document.querySelector('#sonraki-sayfa').addEventListener('click', () => sayfaDegistir(1));

document.querySelectorAll('[data-referans]').forEach((dugme) => dugme.addEventListener('click', async () => {
  kalibrasyonSurumu++;
  const eskiBelge = belge;
  belge = null;
  sayfaNo = 1;
  const dolu = dugme.dataset.referans === 'dolu';
  referansGorsel.src = dolu ? '/ornekler/doldurulmus-kalibrasyon.png' : '/ornekler/kalibrasyon-formu.png';
  referansGorsel.alt = dolu ? 'KAL.pdf dosyasındaki doldurulmuş kalibrasyon formu' : 'Boş kalibrasyon formu';
  referansGorsel.hidden = false;
  tuval.hidden = true;
  dosyaBilgi.hidden = true;
  document.querySelector('#onizleme-adi').textContent = dolu ? 'KAL.pdf' : 'kalibrasyon_formu.pdf';
  document.querySelector('#referans-etiketi').textContent = dolu ? 'Doldurulmuş örnek · Optik doğrulanmadı' : 'Referans form önizlemesi';
  document.querySelector('#adim-yukle').classList.remove('etkin');
  document.querySelectorAll('[data-referans]').forEach((oge) => oge.classList.toggle('etkin', oge === dugme));
  sayfaDugmeleri();
  if (eskiBelge) await pdfKapat(eskiBelge);
}));

const yakinliklar = [50, 75, 100, 125, 150];
let yakinlikSirasi = 2;
function yakinlikDegistir(fark) {
  yakinlikSirasi = Math.max(0, Math.min(yakinliklar.length - 1, yakinlikSirasi + fark));
  document.querySelector('#kagit').className = `kagit yakin-${yakinliklar[yakinlikSirasi]}`;
  document.querySelector('#yakinlik').textContent = `%${yakinliklar[yakinlikSirasi]}`;
  document.querySelector('#uzaklastir').disabled = yakinlikSirasi === 0;
  document.querySelector('#yakinlastir').disabled = yakinlikSirasi === yakinliklar.length - 1;
}
document.querySelector('#uzaklastir').addEventListener('click', () => yakinlikDegistir(-1));
document.querySelector('#yakinlastir').addEventListener('click', () => yakinlikDegistir(1));
document.querySelector('#buyuk-onizleme').addEventListener('click', () => {
  document.querySelector('#buyuk-gorsel').src = tuval.hidden ? referansGorsel.src : tuval.toDataURL('image/png');
  document.querySelector('#gorsel-dialog').showModal();
});

sonuclariGoster();
document.querySelector('#ornek-kontrol').addEventListener('click', () => {
  const inceleme = document.querySelector('#kalibrasyon-incelemesi');
  inceleme.hidden = false;
  inceleme.scrollIntoView({ behavior: 'smooth', block: 'start' });
  bildir('Örnek inceleme açıldı. Ortak kalibrasyon etkinleştirilmedi.');
});
document.querySelectorAll('[data-filtre]').forEach((dugme) => dugme.addEventListener('click', () => {
  document.querySelectorAll('[data-filtre]').forEach((oge) => oge.classList.toggle('etkin', oge === dugme));
  sonuclariGoster(dugme.dataset.filtre);
}));
document.querySelector('#sonuc-indir').addEventListener('click', ornekVeriyiIndir);
