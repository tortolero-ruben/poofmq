<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin Emails
    |--------------------------------------------------------------------------
    |
    | Users with these email addresses can access internal funding and
    | infrastructure details that should not be visible to general users.
    |
    */
    'admin_emails' => array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('POOFMQ_ADMIN_EMAILS', 'rubentortolero@gmail.com'))
    ))),

    /*
    |--------------------------------------------------------------------------
    | Redis Namespace Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration defines the Redis key namespaces used throughout the
    | application. These namespaces follow the ADR-0001 specification for
    | consistent key naming and version management.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Redis Key Namespace Root
    |--------------------------------------------------------------------------
    |
    | The root namespace for all Redis keys. This provides versioning and
    | product isolation for keys stored in Redis.
    |
    */
    'redis_namespace_root' => env('POOFMQ_REDIS_NAMESPACE_ROOT', 'poofmq:v1'),

    /*
    |--------------------------------------------------------------------------
    | Auth Key Namespace
    |--------------------------------------------------------------------------
    |
    | The namespace for API key authentication material stored in Redis.
    | Keys are stored at: {root}:auth:apikey:{key_prefix}
    | Revocation markers at: {root}:auth:revoke:apikey:{key_prefix}
    |
    */
    'redis_auth_namespace' => env('POOFMQ_REDIS_AUTH_NAMESPACE', 'auth'),

    /*
    |--------------------------------------------------------------------------
    | Auth Key TTL Skew Buffer (seconds)
    |--------------------------------------------------------------------------
    |
    | The number of seconds to add to the calculated TTL for auth keys.
    | This buffer accounts for clock skew between services.
    | From ADR-0001: TTL = (expires_at - now) + 300 seconds
    |
    */
    'auth_key_ttl_skew_buffer' => env('POOFMQ_AUTH_KEY_TTL_SKEW_BUFFER', 300),

    /*
    |--------------------------------------------------------------------------
    | Default Auth Key TTL (seconds)
    |--------------------------------------------------------------------------
    |
    | The default TTL for API keys without an expiration date.
    | Keys without expiration are given a 1-year TTL as a safety measure.
    |
    */
    'default_auth_key_ttl' => env('POOFMQ_DEFAULT_AUTH_KEY_TTL', 31536000), // 1 year

];
