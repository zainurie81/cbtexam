<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('android_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('base_url')->default('https://exam.smpn4ngantang.sch.id');
            $table->string('api_url')->default('https://exam.smpn4ngantang.sch.id/api');
            $table->string('exam_url')->default('https://exam.smpn4ngantang.sch.id/join');
            $table->string('min_version')->default('1.0.0');
            $table->string('latest_version')->default('1.0.0');
            $table->boolean('force_update')->default(false);
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('lock_mode')->default(false);
            $table->integer('heartbeat_interval_seconds')->default(5);
            $table->string('cache_policy')->default('clear_on_exit'); // clear_on_exit, clear_on_start, persist
            $table->string('broadcast_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('android_configurations');
    }
};
