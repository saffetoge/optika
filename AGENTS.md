# Optika

Optik form (cevap kâğıdı) okuma çalışma alanı. Laravel 13 uygulamasıdır. Optik okuma motoru, öğrenci eşleştirmesi ve CSV üretimi tarayıcıda çalışan JS modülleridir; sunucu sayfaları, güvenlik başlıklarını ve derlenmiş varlıkları verir. Öğrenci verisi sunucuya gelmez.

## Yığın

- Laravel 13, PHP 8.4, MariaDB (`optika`, testler `optika_test`), Pest 5, Larastan, Pint, Boost.
- Ön yüz: Vite + SCSS (`resources/scss`) + düz JS modülleri (`resources/js`) + pdf.js. Tailwind, Alpine ve jQuery yoktur; yığın geçişi kullanıcı kararıdır.
- Yerelde adres `optika.test` (Herd). Stil ya da JS değişince `npm run build` alınır; `npm run dev` geliştirme sunucusu açmaz, `vite build --watch` ile derlenmiş çıktıyı günceller.
- Vite geliştirme sunucusu bu projede kullanılmaz: sıkı CSP Vite'ın eklediği stilleri engeller, PDF çözücüleri (`pdf-cozuculeri/`) yalnız derlemede üretilir. Geliştirme sunucusu yüklenirse taranmış sayfalar boş çizilir ve okuma her sayfayı "köşe işareti bulunamadı" diye ayırır (2026-11-19'da Herd'in yardımcı süreci `npm run dev` başlattığında ölçüldü). Bu yüzden uygulama `public/hot` olsa da her zaman derlenmiş çıktıyı yükler (`app/Support/DerlenmisVite.php`, AppServiceProvider'da bağlı).

## Merkezler

| Konu | Merkez |
|---|---|
| Sayfa listesi, sayfa başlığı, menü simgesi | app/Enums/Sayfa.php |
| Rotalar | routes/web.php |
| CSP ve güvenlik başlıkları | app/Http/Middleware/GuvenlikBasliklari.php |
| Ön yüz varlıklarının her zaman derlenmiş çıktıdan yüklenmesi | app/Support/DerlenmisVite.php |
| Sayfa iskeleti ve menü | resources/views/arayuz.blade.php |
| Hata sayfaları | resources/views/errors/ |
| Tema renkleri ve ölçüler | resources/scss/_marka.scss |
| PDF açma, sayfalama, sayfa sayısı | resources/js/pdf.js |
| Form şablonu: ölçek, madde, ölçüm, kod hanesi, boş değer | resources/js/form-sablonu.js |
| Okuma eşikleri ve okuma ayarı sürümü | resources/js/okuma-profili.js |
| Sayfa okuma: köşe, şerit, başlık, işaret kararı | resources/js/optik-okuyucu.js, hizalama.js, goruntu.js |
| Ölçüm eşleştirme kuralı ve veri tablosu | resources/js/olcum-birlestirme.js |
| Okuma sonucu, okul kodu, CSV dosya adları | resources/js/okuma-sonucu.js |
| CSV biçimi | resources/js/csv.js |
| Sonucun tarayıcıda saklanması | resources/js/sonuc-deposu.js |
| Okuma önkoşulu | resources/js/kalibrasyon-durumu.js |
| Kalibrasyon yönergeleri ve örnek sonuçlar | resources/js/kalibrasyon.js |
| Kalibrasyona özel inceleme tablosu | resources/js/kalibrasyon-sonuclari.js |

## Kurallar

- Veritabanı MariaDB'dir. SQLite kullanılmaz; testler de MariaDB (`optika_test`) üzerinde çalışır. Şu an yalnız Laravel'in varsayılan tabloları vardır; öğrenci verisi veritabanına yazılmaz.
- Yüklenen PDF ve okuma sonuçları tarayıcıdan çıkmaz: `fetch`, `XMLHttpRequest`, `sendBeacon` yoktur, sonuç tarayıcıda saklanır. Sonuçları veritabanına yazmak ya da giriş eklemek kullanıcı kararıdır.
- Okuma, `okuma-profili.js` içindeki yerleşik ve sürümlü ayarla yapılır. Kalibrasyon sayfası örnek gösterimdir: yüklenen kalibrasyon formu okuma ayarını değiştirmez, tarayıcı kaydı yalnız adayın adını ve sayfa sayısını tutar.
- Kalibrasyon yalnız /kalibrasyon sayfasındadır. PDF okuma /okuma sayfasındadır ve ana sayfa da odur; sonuçlar /sonuclar sayfasındadır. Kalibrasyon formu ve örnek sonuçlar okuma sonuçlarına karışmaz.
- PDF sayfa sayısı katılımcı sayısı olarak sunulmaz; bir cevap kâğıdı iki sayfadır.
- Öğrenci eşleştirmesi form numarasıyla değil 8 haneli kişisel kodla yapılır. Kural `olcum-birlestirme.js` içindeki `eslesmeKurali`dır. İki aday eşit yakınlıktaysa öğrencinin diğer ölçümde kodla bağlanan kâğıdının koduna bakılır ve seçim sonuç sayfasında bildirilir; o da ayırt etmiyorsa hiçbiri bağlanmaz, uyarı verilir.
- Satır içi JS/CSS, olay öznitelikleri ve HTML yorumu yoktur; önyükleme istisnası yoktur. Açıklama gerekirse Blade yorumu kullanılır, sunucuda kalır.
- CSP: `script-src` yalnız istek başına nonce ve `'strict-dynamic'` içerir; `unsafe-inline` ve `unsafe-eval` yoktur. Nonce `Vite::useCspNonce()` ile üretilir, `@vite` etiketlere ekler. Boost'un tarayıcı günlüğü betiği kapalıdır (`config/boost.php`).
- Kullanıcıya ham kod değeri ve HTTP durum kodu gösterilmez; hata sayfaları Türkçedir.
- Kapı `composer kontrol`: composer validate ve audit, Pint, Larastan, `npm run kontrol` (JS testleri, derleme, npm audit) ve Pest. İş bitmeden geçer. Mimari testler veritabanı açmaz.
- Derlenmiş çıktı (`public/build`) depoya girmez.
- Commit, push, dal açma ve stash kullanıcı istemeden yapılmaz.

## Testler

| Klasör | Araç | Kapsam |
|---|---|---|
| tests/Feature | Pest | Sayfalar, rotalar, güvenlik başlıkları, hata sayfaları |
| tests/Mimari | Pest | Satır içi kod, CDN, renk merkezi, veritabanı motoru, hata ayıklama çağrısı |
| tests/Js/Mimari, tests/Js/Okuma | node --test | Okuma motoru, eşleştirme, CSV, JS mimari kuralları |

## Terimler

| Terim | Kodda karşılığı |
|---|---|
| Kalibrasyon | kalibrasyon |
| Okuma kuyruğu | dosyalar |
| Örnek sonuç | ornekSonuclar |
| Ölçüm (ön test, son test, kalıcılık) | olcumler: on, son, kal |
| Kişisel kod | kod |
| Form numarası | formNo |
| Okuma ayarı | okumaProfili |
| Ayrılan evrak | ayrilanlar |
| Okul kodu | okul |

## Ortak bilgi tabanı

Proje bilgisi `/Users/saffetoge/Notlar/optika/bilgi/` altındadır: dizin `MEMORY.md`, tasarım kuralları `DESIGN.md`. Her ajan işe başlamadan `MEMORY.md`'yi okur; arayüz işinde `DESIGN.md` baştan sona okunur. İş takibi `/Users/saffetoge/Notlar/optika/` altındadır.

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.4. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

# Pest

- This project uses Pest. Create tests with `php artisan make:test --pest {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.
- Do not delete tests or test files without approval. They are part of the application.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/pest` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

</laravel-boost-guidelines>
