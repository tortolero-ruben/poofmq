<?php

namespace App\Services;

use App\Exceptions\RailwayGraphqlException;
use Illuminate\Support\Facades\Http;

class RailwayGraphqlClient
{
    /**
     * Execute an authenticated Railway GraphQL query.
     *
     * @param  array<string, mixed>  $variables
     * @return array<string, mixed>
     */
    public function query(string $query, array $variables = []): array
    {
        $apiToken = config('services.railway.api_token');
        $endpoint = config('services.railway.graphql_endpoint');

        if (! is_string($apiToken) || $apiToken === '' || ! is_string($endpoint) || $endpoint === '') {
            throw new \RuntimeException('Railway GraphQL API credentials are not configured.');
        }

        $response = Http::withToken($apiToken)
            ->acceptJson()
            ->timeout((int) config('services.railway.timeout_seconds', 10))
            ->post($endpoint, [
                'query' => $query,
                'variables' => $variables,
            ]);

        if (! $response->successful()) {
            throw new RailwayGraphqlException('Unable to fetch Railway GraphQL response.');
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        $errors = $payload['errors'] ?? null;

        if (is_array($errors) && $errors !== []) {
            throw RailwayGraphqlException::fromErrors($errors);
        }

        $data = $payload['data'] ?? null;

        if (! is_array($data)) {
            throw new RailwayGraphqlException('Railway GraphQL response did not include data.');
        }

        return $data;
    }
}
