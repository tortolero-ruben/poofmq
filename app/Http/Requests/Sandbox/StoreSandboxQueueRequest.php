<?php

namespace App\Http\Requests\Sandbox;

use App\Services\TurnstileService;
use Illuminate\Foundation\Http\FormRequest;

class StoreSandboxQueueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'turnstile_token' => ['required', 'string'],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'turnstile_token.required' => 'The Turnstile verification token is required.',
            'turnstile_token.string' => 'The Turnstile token must be a valid string.',
        ];
    }

    /**
     * Verify the Turnstile token.
     */
    public function verifyTurnstile(TurnstileService $turnstileService): bool
    {
        return $turnstileService->verify(
            token: $this->validated('turnstile_token'),
            clientIp: $this->ip()
        );
    }
}
