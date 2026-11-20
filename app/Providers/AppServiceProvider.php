<?php

namespace App\Providers;

use App\Support\DerlenmisVite;
use Illuminate\Foundation\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Vite::class, DerlenmisVite::class);
    }

    public function boot(): void
    {
        //
    }
}
