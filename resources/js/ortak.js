let bildirimZamani;
export function bildir(metin) {
  const bildirim = document.querySelector('#bildirim');
  clearTimeout(bildirimZamani);
  bildirim.textContent = metin;
  bildirim.hidden = false;
  bildirimZamani = setTimeout(() => { bildirim.hidden = true; }, 6500);
}

export function dosyaAlaniBagla(alanId, girdiId, islem) {
  const alan = document.getElementById(alanId);
  const girdi = document.getElementById(girdiId);
  girdi.addEventListener('change', async () => { if (girdi.files.length) await islem([...girdi.files]); girdi.value = ''; });
  ['dragenter', 'dragover'].forEach((tur) => alan.addEventListener(tur, (olay) => { olay.preventDefault(); alan.classList.add('surukleniyor'); }));
  ['dragleave', 'drop'].forEach((tur) => alan.addEventListener(tur, (olay) => { olay.preventDefault(); alan.classList.remove('surukleniyor'); }));
  alan.addEventListener('drop', async (olay) => { if (olay.dataTransfer.files.length) await islem([...olay.dataTransfer.files]); });
}

export function dosyaIndir(ad, icerik, tur) {
  const adres = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const baglanti = document.createElement('a');
  baglanti.href = adres;
  baglanti.download = ad;
  baglanti.click();
  setTimeout(() => URL.revokeObjectURL(adres), 1000);
}
