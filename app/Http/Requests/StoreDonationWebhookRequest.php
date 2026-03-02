<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDonationWebhookRequest extends FormRequest
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
            'provider' => ['required', 'string', 'max:64'],
            'provider_event_id' => ['required', 'string', 'max:128'],
            'event_type' => ['required', 'string', 'in:donation_received,refund_issued,chargeback_issued,adjustment'],
            'amount_cents' => ['required', 'integer', 'not_in:0'],
            'currency' => ['required', 'string', 'size:3'],
            'happened_at' => ['required', 'date'],
            'donor_name' => ['nullable', 'string', 'max:255'],
            'donor_email' => ['nullable', 'email:rfc', 'max:255'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
