<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApiKeyRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'project_id' => [
                'nullable',
                'ulid',
                Rule::exists('projects', 'id')->where(fn ($query) => $query->where('user_id', $this->user()->id)),
            ],
            'expires_at' => ['nullable', 'date', 'after:now'],
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
            'name.required' => 'A name is required for the API key.',
            'name.max' => 'The API key name cannot exceed 255 characters.',
            'project_id.ulid' => 'The selected project is invalid.',
            'project_id.exists' => 'The selected project is invalid.',
            'expires_at.date' => 'The expiration date must be a valid date.',
            'expires_at.after' => 'The expiration date must be in the future.',
        ];
    }
}
