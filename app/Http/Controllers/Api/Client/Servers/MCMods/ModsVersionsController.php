<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\MCMods;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\MCModsConfig;

class ModsVersionsController extends Controller
{

    public function index(Request $request, Server $server)
    {
        $category = $request->query('category');
        $modId = $request->query('modId');

        $url = $this->getUrl($category, $modId);
        $response = Http::withHeaders($this->getHeaders($category))->get($url);

        if ($response->failed()) {
            return response()->json(['status' => 'error'], 404);
        }

        $data = $response->json();
        $formattedData = $this->formatResponse($category, $data);

        return response()->json(['data' => $formattedData]);
    }

    private function getUrl(string $category, string|int $modId): string
    {
        return match ($category) {
            'modrinth' => "https://api.modrinth.com/v2/project/{$modId}/version",
            'curseforge' => "https://api.curseforge.com/v1/mods/{$modId}/files",
        };
    }

    private function getHeaders(string $category): array
    {
        $config = MCModsConfig::first();
        $apiKey = $config ? $config->curseforge_api_key : null;

        return match ($category) {
            'modrinth' => [],
            'curseforge' => [
                'Accept' => 'application/json',
                'x-api-key' => $apiKey,
            ],
        };
    }

    private function formatResponse(string $category, array $data): array
    {
        return match ($category) {
            'modrinth' => array_map(fn($version) => [
                'category' => $category,
                'versionId' => $version['id'],
                'versionName' => $version['name'],
                'downloads' => $version['downloads'] > 0 ? $version['downloads'] : null,
                'downloadUrl' => null,
            ], $data),
            'curseforge' => array_map(fn($version) => [
                'category' => $category,
                'versionId' => $version['id'],
                'versionName' => $version['displayName'],
                'downloads' => $version['downloadCount'] > 0 ? $version['downloadCount'] : null,
                'downloadUrl' => null,
            ], $data['data']),
        };
    }
}
