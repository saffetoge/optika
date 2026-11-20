const yollar = {
  tarama: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/><circle cx="12" cy="12" r="3"/>',
  ayar: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  grafik: '<path d="M4 4v16h16M9 15v-4m5 4V7m5 8V4"/>',
  kitap: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/>',
  belge: '<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8m-8 4h6"/>',
  indir: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  yukle: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  ok: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  asagi: '<path d="m8 10 4 4 4-4"/>',
  sag: '<path d="m9 6 6 6-6 6"/>',
  sol: '<path d="m15 6-6 6 6 6"/>',
  arti: '<path d="M5 12h14M12 5v14"/>',
  eksi: '<path d="M5 12h14"/>',
  carpi: '<path d="m6 6 12 12M6 18 18 6"/>',
  buyut: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  kose: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8z"/>',
  bilgi: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  yardim: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3v1"/>',
  kilit: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  gunes: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  katman: '<path d="m12 3 10 5-10 5L2 8zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
};

export function simgeleriYerlestir(kok = document) {
  kok.querySelectorAll('[data-simge]').forEach((oge) => {
    const yol = yollar[oge.dataset.simge];
    if (yol) oge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${yol}</svg>`;
  });
}
