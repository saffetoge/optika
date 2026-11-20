<?php

namespace App\Support;

use Illuminate\Foundation\Vite;

class DerlenmisVite extends Vite
{
    public function isRunningHot(): bool
    {
        return false;
    }
}
