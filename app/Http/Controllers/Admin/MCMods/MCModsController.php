<?php

namespace Pterodactyl\Http\Controllers\Admin\MCMods;

use Illuminate\Http\Request;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\MCModsConfig;

class MCModsController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
    ) {}

    public function index(Request $request)
    {
        $config = MCModsConfig::first();
        if (!$config) {
            $config = new MCModsConfig();
            $config->curseforge_api_key = null;
            $config->save();
        }

        return view('admin.mcmods.index', [
            'config' => $config,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'curseforge_api_key' => 'required|string|max:255',
        ]);

        $config = MCModsConfig::first();
        $config->curseforge_api_key = $request->input('curseforge_api_key');
        $config->save();

        $this->alert->success('Successfully updated CurseForge API Key.')->flash();
        return redirect()->route('admin.mcmods');
    }
}
