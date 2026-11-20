import '../scss/uygulama.scss';
import { simgeleriYerlestir } from './simgeler';
import { ortakDurumuGoster } from './okuyucu-durumu';

const eskiSayfa = location.hash.slice(1);
if (location.pathname === '/' && ['kalibrasyon', 'okuma', 'sonuclar'].includes(eskiSayfa)) {
  location.replace(`/${eskiSayfa}`);
} else {
  const sayfa = document.body.dataset.sayfa;
  document.querySelectorAll('[data-sayfa-baglantisi]').forEach((baglanti) => {
    const etkin = baglanti.dataset.sayfaBaglantisi === sayfa;
    baglanti.classList.toggle('etkin', etkin);
    if (etkin) baglanti.setAttribute('aria-current', 'page');
  });
  simgeleriYerlestir();
  ortakDurumuGoster();
  document.querySelectorAll('[data-rehber]').forEach((dugme) => dugme.addEventListener('click', () => document.querySelector('#rehber').showModal()));
  document.querySelectorAll('[data-kapat]').forEach((dugme) => dugme.addEventListener('click', () => dugme.closest('dialog').close()));
  window.addEventListener('storage', ortakDurumuGoster);
  window.addEventListener('pageshow', ortakDurumuGoster);
  if (sayfa === 'kalibrasyon') await import('./kalibrasyon-sayfasi');
  if (sayfa === 'okuma') await import('./okuma-sayfasi');
  if (sayfa === 'sonuclar') await import('./sonuclar-sayfasi');
}
