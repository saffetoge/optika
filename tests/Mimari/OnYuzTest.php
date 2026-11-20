<?php

it('görünümlerde satır içi betik, stil, olay özniteliği ve HTML yorumu yoktur', function () {
    $gorunumler = dosyalariListele(resource_path('views'), '.blade.php');

    expect($gorunumler)->not->toBeEmpty();

    foreach ($gorunumler as $yol) {
        expect((string) file_get_contents($yol))
            ->not->toMatch('/<script\b|<style\b|\sstyle\s*=|\son[a-z]+\s*=|javascript:|<!--/i', $yol);
    }
});

it('görünümler ön yüz kütüphanesini dış kaynaktan yüklemez', function () {
    foreach (dosyalariListele(resource_path('views'), '.blade.php') as $yol) {
        expect((string) file_get_contents($yol))
            ->not->toMatch('/cdn\.jsdelivr\.net|unpkg\.com|cdnjs|fonts\.googleapis|fonts\.bunny|cdn\.tailwindcss/i', $yol);
    }
});

it('renk değerleri yalnız tema merkezinde bulunur', function () {
    $stiller = array_filter(
        dosyalariListele(resource_path('scss'), '.scss'),
        fn (string $yol) => ! str_ends_with($yol, '_marka.scss'),
    );

    expect($stiller)->not->toBeEmpty();

    foreach ($stiller as $yol) {
        expect((string) file_get_contents($yol))
            ->not->toMatch('/#[0-9a-f]{3,8}\b|:\s*(?:white|black)\s*[;}]|\brgba?\(/i', $yol);
    }
});

it('ön yüz yığını SCSS ve düz JS modülüdür; jQuery, Alpine ve Tailwind karışmaz', function () {
    $paket = json_decode((string) file_get_contents(base_path('package.json')), true, flags: JSON_THROW_ON_ERROR);
    $bagimliliklar = array_keys(array_merge($paket['dependencies'] ?? [], $paket['devDependencies'] ?? []));

    expect($bagimliliklar)
        ->toContain('sass', 'vite', 'laravel-vite-plugin', 'pdfjs-dist')
        ->not->toContain('jquery', 'alpinejs', 'tailwindcss', '@tailwindcss/vite');
});

it('Laravel\'in İngilizce hata sayfalarının her birinin Türkçe karşılığı vardır', function () {
    $laravelSayfalari = glob(base_path('vendor/laravel/framework/src/Illuminate/Foundation/Exceptions/views/[0-9]*.blade.php')) ?: [];

    expect($laravelSayfalari)->not->toBeEmpty();

    foreach ($laravelSayfalari as $yol) {
        expect(resource_path('views/errors/'.basename($yol)))->toBeFile();
    }

    expect(resource_path('views/errors/4xx.blade.php'))->toBeFile();
    expect(resource_path('views/errors/5xx.blade.php'))->toBeFile();
});

it('npm run dev geliştirme sunucusu açmaz, derlenmiş çıktıyı izleyerek günceller', function () {
    $paket = json_decode((string) file_get_contents(base_path('package.json')), true, flags: JSON_THROW_ON_ERROR);

    expect($paket['scripts']['dev'] ?? null)->toBe('vite build --watch');
    expect($paket['scripts']['build'] ?? null)->toBe('vite build');
});

it('tarayıcıya giden derleme tek giriş noktasından yapılır', function () {
    expect((string) file_get_contents(base_path('vite.config.js')))
        ->toContain("input: ['resources/js/uygulama.js']");

    expect((string) file_get_contents(resource_path('views/arayuz.blade.php')))
        ->toContain("@vite('resources/js/uygulama.js')");
});
