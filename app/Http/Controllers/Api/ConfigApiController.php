<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AndroidConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigApiController extends Controller
{
    /**
     * Get the active Android App configuration parameters.
     */
    public function show(): JsonResponse
    {
        $config = $this->getConfig();

        return response()->json([
            'success' => true,
            'config' => $config,
        ]);
    }

    /**
     * Check if app update is required.
     */
    public function checkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'version_name' => 'required|string',
        ]);

        $config = $this->getConfig();
        $currentVersion = $validated['version_name'];

        $updateRequired = version_compare($currentVersion, $config->min_version, '<');
        $updateAvailable = version_compare($currentVersion, $config->latest_version, '<');

        return response()->json([
            'success' => true,
            'update_required' => $updateRequired,
            'update_available' => $updateAvailable,
            'min_version' => $config->min_version,
            'latest_version' => $config->latest_version,
            'force_update' => $config->force_update,
        ]);
    }

    /**
     * Check if system is under maintenance.
     */
    public function checkStatus(): JsonResponse
    {
        $config = $this->getConfig();

        return response()->json([
            'success' => true,
            'maintenance_mode' => $config->maintenance_mode,
            'broadcast_message' => $config->broadcast_message,
        ]);
    }

    /**
     * Helper to get configuration or default.
     */
    private function getConfig(): AndroidConfiguration
    {
        $config = AndroidConfiguration::first();

        if (! $config) {
            $config = AndroidConfiguration::create([
                'base_url' => 'https://exam.smpn4ngantang.sch.id',
                'api_url' => 'https://exam.smpn4ngantang.sch.id/api',
                'exam_url' => 'https://exam.smpn4ngantang.sch.id/join',
                'min_version' => '1.0.0',
                'latest_version' => '1.0.0',
                'force_update' => false,
                'maintenance_mode' => false,
                'lock_mode' => false,
                'heartbeat_interval_seconds' => 5,
                'cache_policy' => 'clear_on_exit',
            ]);
        }

        return $config;
    }
}
