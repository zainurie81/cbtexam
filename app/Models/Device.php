<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $fillable = [
        'device_id',
        'brand',
        'model',
        'os_version',
        'ram_mb',
        'storage_mb',
        'ip_address',
        'mac_address',
        'app_version',
        'is_rooted',
        'is_developer_mode',
        'is_usb_debugging',
        'is_emulator',
        'is_locked',
    ];

    protected $casts = [
        'is_rooted' => 'boolean',
        'is_developer_mode' => 'boolean',
        'is_usb_debugging' => 'boolean',
        'is_emulator' => 'boolean',
        'is_locked' => 'boolean',
    ];

    public function examSessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }
}
