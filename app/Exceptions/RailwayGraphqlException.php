<?php

namespace App\Exceptions;

use RuntimeException;

class RailwayGraphqlException extends RuntimeException
{
    /**
     * @param  list<array<string, mixed>>  $errors
     */
    public static function fromErrors(array $errors): self
    {
        $firstError = $errors[0]['message'] ?? 'Railway GraphQL request failed.';

        return new self(is_string($firstError) ? $firstError : 'Railway GraphQL request failed.');
    }
}
