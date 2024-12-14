<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\MCMods;

use CURLFile;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Pterodactyl\Models\MCModsConfig;

class InstallModsController extends Controller
{
    private string $modDirectory = '/mods';

    public function __construct(
        private NodeJWTService $jwtService
    ) {}

    public function index(Request $request, Server $server)
    {
        $category = $request->input('category');
        $modId = $request->input('modId');
        $versionId = $request->input('versionId');

        $data = $this->fetchMod($category, $modId, $versionId);
        if ($data['status'] === 'error') {
            return response()->json($data, 500);
        }

        $filePath = 'mods/' . $data['modName'];
        Storage::disk('local')->put($filePath, $data['modFileContent']);

        $status = $this->uploadModToServer($server, $filePath, $request);
        Storage::disk('local')->delete($filePath);

        return response()->json($status);
    }

    private function fetchMod(string $category, ?string $modId, ?string $versionId): array
    {
        try {
            $modDetails = match ($category) {
                'modrinth' => $this->fetchModrinthModData($modId, $versionId),
                'curseforge' => $this->fetchCurseForgeModData($modId, $versionId),
            };

            $modFileContent = file_get_contents($modDetails['url']);
            if ($modFileContent === false) {
                return ['status' => 'error', 'message' => 'Failed to download the mod file'];
            }

            return [
                'status' => 'success',
                'modName' => $modDetails['name'],
                'modFileContent' => $modFileContent,
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'An error occurred: ' . $e->getMessage()];
        }
    }

    private function fetchModrinthModData(?string $modId, ?string $versionId): array
    {
        if ($versionId) {
            $response = Http::get("https://api.modrinth.com/v2/version/{$versionId}");
            $modFile = $response->json()['files'][0];
        } else {
            $response = Http::get("https://api.modrinth.com/v2/project/{$modId}/version");
            $modFile = $response->json()[0]['files'][0];
        }

        $modFileUrl = $modFile['url'];
        $modName = $modFile['filename'];

        return ['url' => $modFileUrl, 'name' => $modName];
    }

    private function fetchCurseForgeModData(?string $modId, ?string $versionId): array
    {
        $config = MCModsConfig::first();
        $apiKey = $config ? $config->curseforge_api_key : null;

        $headers = [
            'Accept' => 'application/json',
            'x-api-key' => $apiKey,
        ];
        if ($versionId) {
            $response = Http::withHeaders($headers)->get("https://api.curseforge.com/v1/mods/{$modId}/files/{$versionId}");
            $modFile = $response->json()['data'];
        } else {
            $response = Http::withHeaders($headers)->get("https://api.curseforge.com/v1/mods/{$modId}/files");
            $modFile = $response->json()['data'][0];
        }

        $modFileUrl = $modFile['downloadUrl'];
        $modName = $modFile['fileName'];

        return ['url' => $modFileUrl, 'name' => $modName];
    }

    private function uploadModToServer(Server $server, string $filePath, Request $request): array
    {
        try {
            $token = $this->jwtService
                ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
                ->setUser($request->user())
                ->setClaims(['server_uuid' => $server->uuid])
                ->handle($server->node, $request->user()->id . $server->uuid);

            $uploadUrl = sprintf(
                '%s/upload/file?token=%s&directory=%s',
                $server->node->getConnectionAddress(),
                $token->toString(),
                urlencode($this->modDirectory)
            );

            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => $uploadUrl,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_CUSTOMREQUEST => "POST",
                CURLOPT_POSTFIELDS => [
                    'files' => new CURLFile(storage_path('app/' . $filePath))
                ],
                CURLOPT_HTTPHEADER => [
                    "Accept: application/json, text/plain, */*"
                ],
                CURLOPT_RETURNTRANSFER => true,
            ]);

            $response = curl_exec($curl);
            $error = curl_error($curl);
            $errorCode = curl_errno($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($errorCode) {
                return ['status' => 'error', 'message' => 'cURL error: ' . $error];
            }

            if ($httpCode >= 400) {
                return ['status' => 'error', 'message' => 'HTTP error: ' . $httpCode];
            }

            return ['status' => 'success', 'message' => 'Mod installed successfully'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'An error occurred during file upload: ' . $e->getMessage()];
        }
    }
}
