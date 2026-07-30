<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    /**
     * Register or check device.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'brand' => 'nullable|string',
            'model' => 'nullable|string',
            'os_version' => 'nullable|string',
            'ram_mb' => 'nullable|integer',
            'storage_mb' => 'nullable|integer',
            'ip_address' => 'nullable|string',
            'mac_address' => 'nullable|string',
            'app_version' => 'nullable|string',
            'is_rooted' => 'nullable|boolean',
            'is_developer_mode' => 'nullable|boolean',
            'is_usb_debugging' => 'nullable|boolean',
            'is_emulator' => 'nullable|boolean',
        ]);

        $device = Device::updateOrCreate(
            ['device_id' => $validated['device_id']],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Device verified.',
            'device' => $device,
        ]);
    }

    /**
     * Get specific device status.
     */
    public function show(string $deviceId): JsonResponse
    {
        $device = Device::where('device_id', $deviceId)->firstOrFail();

        return response()->json([
            'success' => true,
            'device' => $device,
        ]);
    }
}
