<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'go_api' => [
        'base_url' => env('GO_API_BASE_URL', 'http://localhost:8080'),
        'timeout_seconds' => (int) env('GO_API_TIMEOUT_SECONDS', 5),
    ],

    'railway' => [
        'api_token' => env('RAILWAY_API_TOKEN'),
        'workspace_id' => env('RAILWAY_WORKSPACE_ID'),
        'project_id' => env('RAILWAY_PROJECT_ID'),
        'graphql_endpoint' => env('RAILWAY_GRAPHQL_ENDPOINT', 'https://backboard.railway.com/graphql/v2'),
        'timeout_seconds' => (int) env('RAILWAY_API_TIMEOUT_SECONDS', 10),
    ],

    'turnstile' => [
        'site_key' => env('CLOUDFLARE_TURNSTILE_SITE_KEY'),
        'secret_key' => env('CLOUDFLARE_TURNSTILE_SECRET_KEY'),
        'verify_url' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    ],

    'donations' => [
        'webhook_secret' => env('DONATION_WEBHOOK_SECRET'),
    ],

];
