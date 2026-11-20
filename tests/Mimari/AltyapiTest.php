<?php

use App\Http\Middleware\GuvenlikBasliklari;

it('veritabanı MariaDB, testler ayrı MariaDB veritabanında koşar ve SQLite kullanılmaz', function () {
    expect((string) file_get_contents(config_path('database.php')))
        ->toContain("env('DB_CONNECTION', 'mariadb')");

    expect((string) file_get_contents(base_path('phpunit.xml')))
        ->toContain('<env name="DB_CONNECTION" value="mariadb"/>')
        ->toContain('<env name="DB_DATABASE" value="optika_test"/>')
        ->not->toContain('sqlite');

    expect(database_path('database.sqlite'))->not->toBeFile();
});

it('CSP politikası nonce ister, unsafe-inline ve unsafe-eval içermez', function () {
    expect(GuvenlikBasliklari::politika('deneme'))
        ->toContain("script-src 'nonce-deneme' 'strict-dynamic'")
        ->not->toContain('unsafe-inline')
        ->not->toContain('unsafe-eval');
});

it('Boost sayfaya tarayıcı günlüğü betiği eklemez', function () {
    expect(config('boost.browser_logs_watcher'))->toBeFalse();
});

it('uygulama Türkçe ve İstanbul saatindedir', function () {
    expect(config('app.locale'))->toBe('tr');
    expect(config('app.timezone'))->toBe('Europe/Istanbul');
});

arch('hata ayıklama çağrısı kalmaz')
    ->expect(['dd', 'dump', 'ddd', 'ray', 'var_dump', 'print_r'])
    ->not->toBeUsed();
