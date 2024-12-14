@extends('layouts.admin')

@section('title')
    MC Mods Installer
@endsection

@section('content-header')
    <h1>
        MC Mods Installer
        <small>Install & Manage Minecraft Mods easily.</small>
    </h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">MC Mods</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12 col-md-6">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-info-circle"></i> Information</h3>
            </div>
            <div class="box-body">
                <p>
                    MC Mods Installer was created with 
                    <i class="fa fa-heart" style="color: #FB0000"></i> 
                    by <strong>StellarStudios</strong>.
                </p>
                <p>
                    Need help? Join us on 
                    <a href="https://discord.gg/sQjuWcDxBY" target="_blank">Discord</a> for support.
                </p>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <td>Author</td>
                            <td><code>sarthak77</code></td>
                        </tr>
                        <tr>
                            <td>Version</td>
                            <td><code>v1.1</code></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="col-xs-12 col-md-6">
        <div class="box box-info">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-key"></i> API Key Configuration</h3>
            </div>
            <form action="{{ route('admin.mcmods.update') }}" method="POST">
                @csrf
                <div class="box-body">
                    <div class="form-group">
                        <label for="curseforge_api_key">CurseForge API Key:</label>
                        <input type="text" class="form-control" id="curseforge_api_key" name="curseforge_api_key" value="{{ old('curseforge_api_key', $config->curseforge_api_key) }}" required placeholder="Enter your CurseForge API key">
                    </div>
                </div>
                <div class="box-footer">
                    <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Update API Key</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
