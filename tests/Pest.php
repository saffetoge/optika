<?php

use Tests\TestCase;

pest()->extend(TestCase::class)->in('Feature', 'Mimari');

/**
 * @return list<string>
 */
function kapanisHatalari(string $html): array
{
    $tekiller = ['meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'wbr'];
    $yigin = [];
    $hatalar = [];

    preg_match_all('/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/i', $html, $eslesmeler, PREG_SET_ORDER);

    foreach ($eslesmeler as [, $kapanis, $etiket]) {
        $etiket = strtolower($etiket);

        if (in_array($etiket, $tekiller, true)) {
            continue;
        }

        if ($kapanis === '') {
            $yigin[] = $etiket;

            continue;
        }

        $acik = array_pop($yigin);

        if ($acik !== $etiket) {
            $hatalar[] = "{$etiket} kapandı, beklenen {$acik}";
        }
    }

    foreach ($yigin as $acik) {
        $hatalar[] = "{$acik} kapanmadı";
    }

    return $hatalar;
}

/**
 * @return list<string>
 */
function dosyalariListele(string $dizin, string $uzanti): array
{
    $dosyalar = [];

    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dizin, FilesystemIterator::SKIP_DOTS)) as $dosya) {
        if ($dosya instanceof SplFileInfo && str_ends_with($dosya->getFilename(), $uzanti)) {
            $dosyalar[] = $dosya->getPathname();
        }
    }

    sort($dosyalar);

    return $dosyalar;
}
