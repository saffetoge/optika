@extends('arayuz', ['baslik' => 'İstek tamamlanamadı'])

@section('icerik')
<section class="ekran">
  <div class="sayfa-baslik"><div><div class="ust-etiket">İSTEK TAMAMLANAMADI</div><h1>İstek tamamlanamadı</h1><p>Bu işlem şu anda yapılamıyor.</p></div></div>
  <section class="kart bos-durum"><span data-simge="bilgi"></span><h2>Sayfayı yenileyip yeniden deneyin</h2><p>Sorun sürerse ana sayfaya dönüp işleme baştan başlayın.</p><a class="dugme birincil" href="{{ route('ana-sayfa') }}">PDF okumaya git<span data-simge="ok"></span></a></section>
</section>
@endsection
