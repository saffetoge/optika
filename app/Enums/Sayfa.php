<?php

namespace App\Enums;

enum Sayfa: string
{
    case Kalibrasyon = 'kalibrasyon';
    case Okuma = 'okuma';
    case Sonuclar = 'sonuclar';

    public function baslik(): string
    {
        return match ($this) {
            self::Kalibrasyon => 'Kalibrasyon',
            self::Okuma => 'PDF okuma',
            self::Sonuclar => 'Okuma sonuçları',
        };
    }

    public function simge(): string
    {
        return match ($this) {
            self::Kalibrasyon => 'ayar',
            self::Okuma => 'tarama',
            self::Sonuclar => 'grafik',
        };
    }
}
