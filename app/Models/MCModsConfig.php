<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class MCModsConfig extends Model
{
    protected $table = 'mcmods_config';

    protected $fillable = ['curseforge_api_key'];
}