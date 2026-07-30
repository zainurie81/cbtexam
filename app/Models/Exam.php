<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    protected $fillable = [
        'title',
        'description',
        'token',
        'duration_minutes',
        'start_time',
        'end_time',
        'is_active',
        'randomize_questions',
        'auto_submit',
        'security_policy_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'randomize_questions' => 'boolean',
        'auto_submit' => 'boolean',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function securityPolicy(): BelongsTo
    {
        return $this->belongsTo(SecurityPolicy::class);
    }

    public function whitelistUrls(): HasMany
    {
        return $this->hasMany(WhitelistUrl::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }
}
