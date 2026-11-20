@extends('arayuz', ['baslik' => 'Beklenmeyen bir sorun oluştu'])

@section('icerik')
<section class="ekran">
  <div class="sayfa-baslik"><div><div class="ust-etiket">GEÇİCİ SORUN</div><h1>Beklenmeyen bir sorun oluştu</h1><p>Sayfa şu anda açılamadı.</p></div></div>
  <section class="kart bos-durum"><span data-simge="bilgi"></span><h2>Birkaç dakika sonra yeniden deneyin</h2><p>Okuma tarayıcınızda yapıldığı için yüklediğiniz dosyalar bu cihazdan çıkmadı.</p><a class="dugme birincil" href="{{ route('ana-sayfa') }}">PDF okumaya git<span data-simge="ok"></span></a></section>
</section>
@endsection
