<?php

namespace App\Providers;

use App\Models\User;
use App\Services\TurnstileService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TurnstileService::class, fn (): TurnstileService => TurnstileService::fromConfig());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerAuthorization();
        $this->registerHealthChecks();
    }

    /**
     * Register app-specific authorization gates.
     */
    protected function registerAuthorization(): void
    {
        Gate::define('viewAdminFunding', fn (User $user): bool => $user->isAdmin());
    }

    /**
     * Register health check listeners so /up verifies database and Redis when in use.
     */
    protected function registerHealthChecks(): void
    {
        Event::listen(DiagnosingHealth::class, function (): void {
            $connection = config('database.default');
            if ($connection !== 'sqlite' && $connection !== null) {
                DB::connection()->getPdo();
            }

            if (config('cache.default') === 'redis' || config('queue.default') === 'redis') {
                Redis::connection()->ping();
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
