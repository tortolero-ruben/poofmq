<?php

test('mail defaults to resend in production when no mailer is configured', function () {
    $config = loadMailConfigWithEnvironment([
        'APP_ENV' => 'production',
        'MAIL_MAILER' => null,
    ]);

    expect($config['default'])->toBe('resend');
});

test('mail defaults to log outside production when no mailer is configured', function () {
    $config = loadMailConfigWithEnvironment([
        'APP_ENV' => 'local',
        'MAIL_MAILER' => null,
    ]);

    expect($config['default'])->toBe('log');
});

test('explicit mailer configuration still wins over the environment fallback', function () {
    $config = loadMailConfigWithEnvironment([
        'APP_ENV' => 'production',
        'MAIL_MAILER' => 'smtp',
    ]);

    expect($config['default'])->toBe('smtp');
});

/**
 * @param  array{APP_ENV: ?string, MAIL_MAILER: ?string}  $variables
 * @return array<string, mixed>
 */
function loadMailConfigWithEnvironment(array $variables): array
{
    $originalVariables = [
        'APP_ENV' => getenv('APP_ENV') === false ? null : getenv('APP_ENV'),
        'MAIL_MAILER' => getenv('MAIL_MAILER') === false ? null : getenv('MAIL_MAILER'),
    ];

    foreach ($variables as $name => $value) {
        if ($value === null) {
            putenv($name);
            unset($_ENV[$name], $_SERVER[$name]);
        } else {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }

    try {
        /** @var array<string, mixed> $config */
        $config = require __DIR__.'/../../config/mail.php';

        return $config;
    } finally {
        foreach ($originalVariables as $name => $value) {
            if ($value === null) {
                putenv($name);
                unset($_ENV[$name], $_SERVER[$name]);
            } else {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
