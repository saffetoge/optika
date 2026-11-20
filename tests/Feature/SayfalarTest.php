<?php

use App\Enums\Sayfa;
use Illuminate\Support\Facades\Route;

it('her sayfa kendi başlığı, işareti ve tam menüsüyle açılır', function (Sayfa $sayfa) {
    $yanit = $this->get(route($sayfa->value));

    $yanit->assertOk()
        ->assertSee("<title>{$sayfa->baslik()} · Optika</title>", false)
        ->assertSee('data-sayfa="'.$sayfa->value.'"', false)
        ->assertSee('<html lang="tr">', false);

    foreach (Sayfa::cases() as $menu) {
        $yanit->assertSee('href="'.route($menu->value).'" data-sayfa-baglantisi="'.$menu->value.'"', false)
            ->assertSee($menu->baslik());
    }
})->with(Sayfa::cases());

it('ana sayfa PDF okuma sayfasıdır', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee('data-sayfa="okuma"', false)
        ->assertSee('id="okuma-dosyalar"', false);
});

it('işlenmiş her sayfada HTML öğeleri doğru sırayla kapanır', function (string $adres) {
    expect(kapanisHatalari($this->get($adres)->getContent() ?: ''))->toBe([]);
})->with(['/', '/okuma', '/sonuclar', '/kalibrasyon', '/yok-boyle-bir-sayfa']);

it('kalibrasyon formu ve örnek inceleme yalnız kendi sayfasında üretilir', function () {
    $this->get('/kalibrasyon')
        ->assertSee('id="kalibrasyon-incelemesi"', false)
        ->assertSee('id="kalibrasyon-dosya"', false)
        ->assertDontSee('id="okuma-dosyalar"', false);

    foreach (['/', '/okuma', '/sonuclar'] as $adres) {
        $html = $this->get($adres)->getContent() ?: '';

        expect($html)->not->toMatch('/id="kalibrasyon-dosya"|id="kalibrasyon-incelemesi"|KAL\.pdf|Örnek kalibrasyon incelemesi|id="gorsel-dialog"/u');
    }

    $this->get('/sonuclar')->assertSee('Henüz okunmuş test yok');
});

it('okuma ve sonuç sayfası kendi denetimlerini taşır, birbirininkini taşımaz', function () {
    $okuma = $this->get('/okuma');
    $sonuclar = $this->get('/sonuclar');

    foreach (['okul-kodu', 'okumayi-baslat', 'okumayi-durdur', 'okuma-cubugu', 'okuma-dosyalar'] as $kimlik) {
        $okuma->assertSee('id="'.$kimlik.'"', false);
        $sonuclar->assertDontSee('id="'.$kimlik.'"', false);
    }

    foreach (['tum-veri-indir', 'tam-veri-indir', 'ogrenci-satirlari', 'eslesmeyen-satirlari', 'ayrilan-listesi', 'kontrol-listesi', 'sonuclari-temizle'] as $kimlik) {
        $sonuclar->assertSee('id="'.$kimlik.'"', false);
        $okuma->assertDontSee('id="'.$kimlik.'"', false);
    }
});

it('örnek kalibrasyon verisi ve sayfa sayısı gerçek okuma gibi sunulmaz', function () {
    $this->get('/kalibrasyon')
        ->assertSee('Tamamı örnek veridir.')
        ->assertSee('yüklenen dosyayı optik olarak doğrulamaz');

    $this->get('/okuma')->assertSee('bir katılımcı anlamına gelmeyebilir');
});

it('olmayan adres Türkçe sayfa verir ve durum kodunu göstermez', function () {
    $html = $this->get('/yok-boyle-bir-sayfa')
        ->assertNotFound()
        ->assertSee('Sayfa bulunamadı')
        ->assertSee('PDF okumaya git')
        ->getContent() ?: '';

    expect($html)->not->toMatch('/\b404\b|Not Found/');
});

it('istemci ve sunucu hataları Türkçe sayfa verir ve durum kodunu göstermez', function (int $kod, string $baslik) {
    Route::get('/_deneme-hata', fn () => abort($kod));

    $html = $this->get('/_deneme-hata')
        ->assertStatus($kod)
        ->assertSee($baslik)
        ->getContent() ?: '';

    expect($html)
        ->toContain('<html lang="tr">')
        ->not->toMatch('/\b'.$kod.'\b|Unauthorized|Payment Required|Forbidden|Page Expired|Too Many Requests|Server Error|Service Unavailable|I\'m a teapot|Bad Gateway/');
})->with([
    'yetkisiz' => [401, 'İstek tamamlanamadı'],
    'ödeme' => [402, 'İstek tamamlanamadı'],
    'yasak' => [403, 'İstek tamamlanamadı'],
    'süresi dolmuş' => [419, 'İstek tamamlanamadı'],
    'çok istek' => [429, 'İstek tamamlanamadı'],
    'Laravel sayfası olmayan istemci hatası' => [418, 'İstek tamamlanamadı'],
    'sunucu' => [500, 'Beklenmeyen bir sorun oluştu'],
    'ağ geçidi' => [502, 'Beklenmeyen bir sorun oluştu'],
    'bakım' => [503, 'Beklenmeyen bir sorun oluştu'],
]);
