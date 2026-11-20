<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#7154d8">
  <title>{{ $baslik ?? $sayfa->baslik() }} · Optika</title>
  <link rel="icon" href="/simge.svg" type="image/svg+xml">
  @vite('resources/js/uygulama.js')
</head>
<body data-sayfa="{{ isset($sayfa) ? $sayfa->value : '' }}">
  <aside class="kenar-cubugu">
    <a class="marka" href="{{ route('ana-sayfa') }}" aria-label="Optika ana sayfa"><span class="marka-simge" data-simge="tarama"></span>optika<span class="marka-nokta">.</span></a>
    <div class="alan-secimi"><span class="alan-avatar">O</span><span>Çalışma alanım<small>Optik form yönetimi</small></span><span data-simge="asagi"></span></div>
    <p class="menu-baslik">ÇALIŞMA ALANI</p>
    <nav aria-label="Ana menü">
      @foreach (\App\Enums\Sayfa::cases() as $menu)
        <a class="menu-oge" href="{{ route($menu->value) }}" data-sayfa-baglantisi="{{ $menu->value }}"><span data-simge="{{ $menu->simge() }}"></span>{{ $menu->baslik() }}@if ($menu === \App\Enums\Sayfa::Okuma)<span class="menu-sayi" id="kuyruk-sayisi">0</span>@endif</a>
      @endforeach
    </nav>
    <div class="kenar-alt">
      <div class="yardim-karti"><span class="yardim-simge" data-simge="kitap"></span><strong>İlk okumanıza hazır mısınız?</strong><p>Doğru bir başlangıç için kısa kalibrasyon rehberine göz atın.</p><button class="metin-dugme" data-rehber>Rehberi incele <span data-simge="ok"></span></button></div>
      <div class="kullanici"><span class="kullanici-avatar">ÇA</span><span>Çalışma alanım<small>Yerel önizleme</small></span><span class="yesil-nokta"></span></div>
    </div>
  </aside>
  <div class="uygulama">
    <header class="ust-cubuk"><div class="ekmek"><span>Çalışma alanı</span><span class="ayrac">/</span><strong id="ekmek-baslik">{{ $baslik ?? $sayfa->baslik() }}</strong></div><div class="ust-sag"><span class="taslak-etiket"><span></span>Dosyalar bu cihazda kalır</span><button class="simge-dugme" aria-label="Kullanım rehberini aç" data-rehber><span data-simge="yardim"></span></button><span class="ust-avatar">ÇA</span></div></header>
    <main>
      @yield('icerik')
      <footer><span><span class="footer-marka">optika.</span> Her işaretin bir karşılığı var.</span><span>Optik form okuma çalışma alanı</span></footer>
    </main>
  </div>
  <dialog id="rehber"><div class="dialog-baslik"><span class="ust-etiket">BAŞLANGIÇ REHBERİ</span><button class="simge-dugme" data-kapat aria-label="Rehberi kapat"><span data-simge="carpi"></span></button></div><h2>Üç adımda okumaya hazırlanın.</h2><ol class="rehber-adimlari"><li><strong>Formu indirin ve doldurun</strong><p>20 satırın her birindeki yönergeyi uygulayın. Boş, silik ve çift işaret örneklerini de yönergeye uygun bırakın.</p></li><li><strong>Formu tarayın</strong><p>Dört köşe işaretini görünür tutun. Taranmış PDF’yi kalibrasyon alanına bırakın.</p></li><li><strong>Testleri ekleyin ve okutun</strong><p>Test PDF’lerini PDF okuma sayfasına ekleyin ve okumayı başlatın. Okuma bittiğinde eşleşen öğrenciler ve CSV dosyaları sonuç sayfasında hazır olur.</p></li></ol><button class="dugme birincil tam" data-kapat>Anladım, başlayalım<span data-simge="ok"></span></button></dialog>
  <div id="bildirim" role="status" aria-live="polite" hidden></div>
</body>
</html>
