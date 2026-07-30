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
        // Add role to users table if not exists
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('proctor'); // admin, operator, proctor, teacher, principal, student
            });
        }

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('os_version')->nullable();
            $table->integer('ram_mb')->nullable();
            $table->integer('storage_mb')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('app_version')->nullable();
            $table->boolean('is_rooted')->default(false);
            $table->boolean('is_developer_mode')->default(false);
            $table->boolean('is_usb_debugging')->default(false);
            $table->boolean('is_emulator')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        Schema::create('security_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('violation_weights')->nullable(); // e.g. {"root":"critical","screenshot":"medium"}
            $table->boolean('allow_emulator')->default(false);
            $table->boolean('allow_developer_mode')->default(false);
            $table->timestamps();
        });

        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('token')->nullable();
            $table->integer('duration_minutes')->default(60);
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('auto_submit')->default(true);
            $table->foreignId('security_policy_id')->nullable()->constrained('security_policies')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('whitelist_urls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->string('url_pattern');
            $table->timestamps();
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->text('question_text');
            $table->json('options'); // array of options
            $table->string('correct_option');
            $table->timestamps();
        });

        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->string('status')->default('pending'); // pending, active, paused, finished
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->integer('current_question_index')->default(0);
            $table->string('last_known_ip')->nullable();
            $table->integer('battery_level')->nullable();
            $table->integer('ram_usage_pct')->nullable();
            $table->integer('ping_ms')->nullable();
            $table->timestamps();
        });

        Schema::create('violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->string('type'); // e.g. screenshot, app_switch, root_detected
            $table->string('severity')->default('medium'); // light, medium, heavy, critical
            $table->text('details')->nullable();
            $table->string('screenshot_path')->nullable();
            $table->dateTime('detected_at');
            $table->timestamps();
        });

        Schema::create('device_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->string('event_type');
            $table->text('message')->nullable();
            $table->dateTime('occurred_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_logs');
        Schema::dropIfExists('violations');
        Schema::dropIfExists('exam_sessions');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('whitelist_urls');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('security_policies');
        Schema::dropIfExists('devices');
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
