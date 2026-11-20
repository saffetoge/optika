<?php

use Illuminate\Support\Facades\Vite;

function nonceBul(string $politika): string
{
    preg_match("/script-src 'nonce-([^']+)'/", $politika, $eslesme);

    return $eslesme[1] ?? '';
}

it('her yanıt sıkı CSP ve güvenlik başlıklarıyla döner', function (string $adres) {
    $yanit = $this->get($adres);
    $politika = (string) $yanit->headers->get('Content-Security-Policy');

    expect($politika)
        ->toContain("script-src 'nonce-")
        ->toContain("'strict-dynamic'")
        ->toContain("object-src 'none'")
        ->toContain("base-uri 'self'")
        ->toContain("frame-ancestors 'none'")
        ->not->toContain('unsafe-inline')
        ->not->toContain('unsafe-eval');

    expect($yanit->headers->get('X-Content-Type-Options'))->toBe('nosniff');
    expect($yanit->headers->get('Referrer-Policy'))->toBe('same-origin');
})->with(['/', '/okuma', '/sonuclar', '/kalibrasyon', '/yok-boyle-bir-sayfa']);

it('sayfadaki her betik isteğe özel nonce taşır', function () {
    expect(is_file(public_path('build/manifest.json')))->toBeTrue('Derlenmiş ön yüz yok; önce npm run build çalıştırın.');

    $ilk = $this->get('/okuma');
    $nonce = nonceBul((string) $ilk->headers->get('Content-Security-Policy'));
    $html = $ilk->getContent() ?: '';

    expect($nonce)->toMatch('/^[A-Za-z0-9+\/=_-]{16,}$/');

    preg_match_all('/<script\b[^>]*>/i', $html, $betikler);

    expect($betikler[0])->not->toBeEmpty();

    foreach ($betikler[0] as $betik) {
        expect($betik)->toContain('nonce="'.$nonce.'"')->toContain('src="');
    }

    $ikinci = nonceBul((string) $this->get('/okuma')->headers->get('Content-Security-Policy'));

    expect($ikinci)->not->toBe($nonce);
});

it('Vite geliştirme sunucusu açık olsa da sayfa derlenmiş çıktıyı yükler', function () {
    $hot = storage_path('framework/testing/hot');
    is_dir(dirname($hot)) || mkdir(dirname($hot), 0755, true);
    file_put_contents($hot, 'http://[::1]:5173');

    try {
        Vite::useHotFile($hot);

        $this->get('/okuma')
            ->assertOk()
            ->assertDontSee('5173', false)
            ->assertDontSee('@vite/client', false)
            ->assertSee('/build/assets/', false);
    } finally {
        unlink($hot);
    }
});

it('sayfada gövdeli betik, olay özniteliği ve dış adres bulunmaz', function (string $adres) {
    $html = $this->get($adres)->getContent() ?: '';

    expect($html)
        ->not->toMatch('/<script\b[^>]*>\s*[^<\s]/i')
        ->not->toMatch('/<style\b|\sstyle\s*=|\son[a-z]+\s*=|javascript:/i')
        ->not->toMatch('/(?:src|href)="https?:\/\/(?!localhost)/i');
})->with(['/okuma', '/sonuclar', '/kalibrasyon']);
