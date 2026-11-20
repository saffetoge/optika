@extends('arayuz', ['baslik' => 'Sayfa bulunamadı'])

@section('icerik')
<section class="ekran">
  <div class="sayfa-baslik"><div><div class="ust-etiket">ADRES BULUNAMADI</div><h1>Sayfa bulunamadı</h1><p>Açmak istediğiniz adres bu çalışma alanında yok.</p></div></div>
  <section class="kart bos-durum"><span data-simge="belge"></span><h2>Bu adreste bir sayfa yok</h2><p>Bağlantı eksik ya da eski olabilir. Menüden devam edin.</p><a class="dugme birincil" href="{{ route('ana-sayfa') }}">PDF okumaya git<span data-simge="ok"></span></a></section>
</section>
@endsection
