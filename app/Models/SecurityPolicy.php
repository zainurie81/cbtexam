<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SecurityPolicy extends Model
{
    protected $fillable = [
        'name',
        'violation_weights',
        'allow_emulator',
        'allow_developer_mode',
    ];

    protected $casts = [
        'violation_weights' => 'array',
        'allow_emulator' => 'boolean',
        'allow_developer_mode' => 'boolean',
    ];

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}
