<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreApiKeyRequest;
use App\Models\ApiKey;
use App\Models\Project;
use App\Services\ApiKeyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeyController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        public ApiKeyService $apiKeyService
    ) {}

    /**
     * Display a listing of the user's API keys.
     */
    public function index(Request $request): Response
    {
        $apiKeys = ApiKey::query()
            ->where('user_id', $request->user()->id)
            ->with('project:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ApiKey $apiKey) => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key_prefix' => $apiKey->key_prefix,
                'project_id' => $apiKey->project_id,
                'project_name' => $apiKey->project?->name,
                'expires_at' => $apiKey->expires_at?->toIso8601String(),
                'revoked_at' => $apiKey->revoked_at?->toIso8601String(),
                'revoked_by' => $apiKey->revoked_by,
                'created_at' => $apiKey->created_at->toIso8601String(),
                'is_valid' => $apiKey->isValid(),
            ]);

        $projects = Project::query()
            ->where('user_id', $request->user()->id)
            ->notArchived()
            ->orderBy('name')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
            ]);

        return Inertia::render('settings/api-keys', [
            'apiKeys' => $apiKeys,
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created API key in storage.
     */
    public function store(StoreApiKeyRequest $request): JsonResponse
    {
        $this->authorize('create', ApiKey::class);

        $result = $this->apiKeyService->generate(
            user: $request->user(),
            name: $request->validated('name'),
            expiresAt: $request->validated('expires_at')
                ? \Carbon\Carbon::parse($request->validated('expires_at'))
                : null,
            projectId: $request->validated('project_id')
        );
        $result['api_key']->load('project:id,name');

        return response()->json([
            'api_key' => [
                'id' => $result['api_key']->id,
                'name' => $result['api_key']->name,
                'key_prefix' => $result['api_key']->key_prefix,
                'project_id' => $result['api_key']->project_id,
                'project_name' => $result['api_key']->project?->name,
                'expires_at' => $result['api_key']->expires_at?->toIso8601String(),
                'created_at' => $result['api_key']->created_at->toIso8601String(),
            ],
            'plain_text_key' => $result['plain_text_key'],
            'message' => 'Make sure to copy your API key now. You won\'t be able to see it again!',
        ], 201);
    }

    /**
     * Remove the specified API key from storage (revoke it).
     */
    public function destroy(Request $request, ApiKey $apiKey): JsonResponse|RedirectResponse
    {
        $this->authorize('delete', $apiKey);

        $revoked = $this->apiKeyService->revoke($apiKey, $request->user());

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $revoked
                    ? 'API key revoked successfully.'
                    : 'API key is already revoked.',
            ]);
        }

        return back()->with('status', 'API key revoked successfully.');
    }
}
