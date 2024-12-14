<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\MCMods;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\MCModsConfig;

class ModsManagerController extends Controller
{
    public function index(Request $request, Server $server)
    {
        $category = $request->query('category', 'modrinth');
        $page = $request->query('page', 1);
        $pageSize = $request->query('page_size', 6);
        $searchQuery = $request->query('search_query', '');
        $type = $request->query('type', '');
        $sortBy = $request->query('sort_by', '');
        $minecraftVersion = $request->query('minecraft_version', '');

        $url = $this->getUrl($category, $page, $pageSize, $searchQuery, $type, $sortBy, $minecraftVersion);
        $response = Http::withHeaders($this->getHeaders($category))->get($url);

        if ($response->failed()) {
            return response()->json(['status' => 'error'], 404);
        }

        $data = $response->json();
        $pagination = $this->getPagination($category, $data, $page, $pageSize);
        $formattedData = $this->formatResponse($category, $data);

        return response()->json([
            'data' => $formattedData,
            'pagination' => $pagination,
        ]);
    }

    private function getUrl(string $category, int $page, int $pageSize, string $searchQuery, string $type, string $sortBy, string $minecraftVersion): string
    {
        $offset = ($page - 1) * $pageSize;

        return match ($category) {
            'modrinth' => $this->getModrinthUrl($pageSize, $searchQuery, $sortBy, $offset, $type, $minecraftVersion),
            'curseforge' => $this->getCurseForgeUrl($pageSize, $searchQuery, $sortBy, $offset, $type, $minecraftVersion),
        };
    }

    private function getModrinthUrl(int $pageSize, string $searchQuery, string $sortBy, int $offset, string $type, string $minecraftVersion): string
    {
        $baseUrl = "https://api.modrinth.com/v2/search";
        $facets = [
            ["categories:$type"],
            ["server_side!=unsupported"],
        ];

        if ($minecraftVersion) {
            $facets[] = ["versions:$minecraftVersion"];
        }

        $facetsQuery = urlencode(json_encode($facets));

        return "{$baseUrl}?limit={$pageSize}&query={$searchQuery}&index={$sortBy}&offset={$offset}&facets={$facetsQuery}";
    }

    private function getCurseForgeUrl(int $pageSize, string $searchQuery, string $sortBy, int $offset, string $type, string $minecraftVersion): string
    {
        $gameId = 432;
        $sortOrder = "desc";
        $baseUrl = "https://api.curseforge.com/v1/mods/search";

        return "{$baseUrl}?gameId={$gameId}&pageSize={$pageSize}&index={$offset}&searchFilter={$searchQuery}&modLoaderType={$type}&gameVersion={$minecraftVersion}&sortField={$sortBy}&sortOrder={$sortOrder}";
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

    private function getPagination(string $category, array $data, int $page, int $pageSize): array
    {
        return match ($category) {
            'modrinth' => [
                'total' => (int)$data['total_hits'],
                'count' => count($data['hits']),
                'per_page' => $pageSize,
                'current_page' => $page,
                'total_pages' => (int)ceil($data['total_hits'] / $pageSize),
            ],
            'curseforge' => [
                'total' => (int)$data['pagination']['totalCount'],
                'count' => (int)$data['pagination']['resultCount'],
                'per_page' => $pageSize,
                'current_page' => $page,
                'total_pages' => (int)ceil(
                ((int)$data['pagination']['totalCount'] < 9996 
                ? (int)$data['pagination']['totalCount'] 
                : 9996) / $pageSize
                ),
            ],
        };
    }

    private function formatResponse(string $category, array $data): array
    {
        return match ($category) {
            'modrinth' => $this->formatModrinthResponse($data),
            'curseforge' => $this->formatCurseForgeResponse($data),
        };
    }

    private function formatModrinthResponse(array $data): array
    {
        return array_map(function ($mod) {
            return [
                'category' => 'modrinth',
                'id' => $mod['project_id'],
                'name' => $mod['title'],
                'description' => $mod['description'],
                'icon' => $mod['icon_url'],
                'downloads' => $mod['downloads'],
                'modUrl' => "https://modrinth.com/mod/{$mod['project_id']}",
                'installable' => true,
            ];
        }, $data['hits']);
    }

    private function formatCurseForgeResponse(array $data): array
    {
        return array_map(function ($mod) {
            return [
                'category' => 'curseforge',
                'id' => $mod['id'],
                'name' => $mod['name'],
                'description' => $mod['summary'],
                'icon' => $mod['logo']['url'],
                'downloads' => $mod['downloadCount'],
                'modUrl' => "https://www.curseforge.com/minecraft/mc-mods/{$mod['slug']}",
                'installable' => true,
            ];
        }, $data['data']);
    }
}
