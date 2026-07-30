<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AndroidConfiguration extends Model
{
    protected $fillable = [
        'base_url',
        'api_url',
        'exam_url',
        'min_version',
        'latest_version',
        'force_update',
        'maintenance_mode',
        'lock_mode',
        'heartbeat_interval_seconds',
        'cache_policy',
        'broadcast_message',
    ];

    protected $casts = [
        'force_update' => 'boolean',
        'maintenance_mode' => 'boolean',
        'lock_mode' => 'boolean',
        'heartbeat_interval_seconds' => 'integer',
    ];
}
