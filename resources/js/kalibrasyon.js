export const yonergeler = [
  "3’ü normal şekilde, tamamen karala", "1’i tamamen karala", "5’i tamamen karala",
  "2’yi hafifçe, yarım bırakarak karala", "4’ü çok silik, zar zor görünecek şekilde karala",
  "3’ü karala ama dışına taşır", "2’nin içine X at", "4’ün içine tik at",
  "3’ü çevrele, içini boş bırak", "Bu satırı tamamen boş bırak", "2 ve 4’ü birlikte karala",
  "1’i karala, sonra sil; 5’i karala", "3’ü merkezden kaydırarak karala",
  "2’yi mavi tükenmez kalemle karala", "5’i sert bastırarak, çok koyu karala",
  "3’ün yalnız sol yarısını karala", "4’ün içine küçük bir nokta koy",
  "2’yi karala, komşu yuvarlağa da değsin", "1’i karala, sonra tamamen sil",
  "4’ü normal şekilde, tamamen karala",
];

export const durumlar = {
  isaretli: { etiket: 'İşaretli', renk: 'yesil' },
  kontrol: { etiket: 'Kontrol gerekli', renk: 'turuncu' },
  bos: { etiket: 'Boş', renk: '' },
};

const ornekIsaretler = [[3], [1], [5], [2], [4], [3], [2], [4], [3], [], [2, 4], [5], [3], [2], [5], [3], [4], [2], [], [4]];
const ornekKontroller = new Set([4, 5, 6, 7, 8, 9, 11, 12, 13, 16, 17, 18, 19]);

export const ornekSonuclar = yonergeler.map((yonerge, sira) => ({
  satir: sira + 1,
  yonerge,
  secimler: ornekIsaretler[sira],
  durum: ornekKontroller.has(sira + 1) ? 'kontrol' : ornekIsaretler[sira].length ? 'isaretli' : 'bos',
}));

export function sonucOzeti(sonuclar) {
  return {
    toplam: sonuclar.length,
    kontrol: sonuclar.filter((satir) => satir.durum === 'kontrol').length,
    bos: sonuclar.filter((satir) => satir.secimler.length === 0).length,
  };
}
