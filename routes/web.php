<?php

use App\Enums\Sayfa;
use Illuminate\Support\Facades\Route;

Route::view('/', Sayfa::Okuma->value, ['sayfa' => Sayfa::Okuma])->name('ana-sayfa');

foreach (Sayfa::cases() as $sayfa) {
    Route::view($sayfa->value, $sayfa->value, ['sayfa' => $sayfa])->name($sayfa->value);
}
