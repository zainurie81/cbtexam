<?php

use App\Models\AndroidConfiguration;
use App\Models\Device;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\SecurityPolicy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('students can login via api', function () {
    $user = User::factory()->create([
        'email' => 'candidate@seb.com',
        'password' => bcrypt('password'),
        'role' => 'student',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'candidate@seb.com',
        'password' => 'password',
        'device_id' => 'test_android_id_123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'token',
            'user' => ['id', 'name', 'email', 'role'],
        ]);
});

test('can register android device', function () {
    $response = $this->postJson('/api/device/register', [
        'device_id' => 'test_android_id_123',
        'brand' => 'Google',
        'model' => 'Pixel 7',
        'os_version' => '13',
        'ram_mb' => 8192,
        'storage_mb' => 128000,
        'ip_address' => '192.168.1.1',
        'mac_address' => '00:11:22:33:44:55',
        'app_version' => '1.0.0',
        'is_rooted' => false,
        'is_developer_mode' => false,
        'is_usb_debugging' => false,
        'is_emulator' => false,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Device verified.',
        ]);

    $this->assertDatabaseHas('devices', [
        'device_id' => 'test_android_id_123',
        'model' => 'Pixel 7',
    ]);
});

test('student can join exam and report telemetry', function () {
    // 1. Setup Models
    $user = User::factory()->create(['role' => 'student']);

    $policy = SecurityPolicy::create([
        'name' => 'Test Policy',
        'allow_emulator' => false,
        'allow_developer_mode' => false,
    ]);

    $exam = Exam::create([
        'title' => 'Biology 101',
        'token' => 'BIO101',
        'duration_minutes' => 60,
        'is_active' => true,
        'security_policy_id' => $policy->id,
    ]);

    $device = Device::create([
        'device_id' => 'device_id_555',
        'brand' => 'Xiaomi',
        'model' => 'Mi 11',
        'is_locked' => false,
    ]);

    // 2. Join Exam
    $response = $this->postJson('/api/exams/join', [
        'token' => 'BIO101',
        'device_id' => 'device_id_555',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('exam.title', 'Biology 101');

    // 3. Start Session (authenticate with Sanctum first)
    $this->actingAs($user, 'sanctum');

    $response = $this->postJson('/api/session/start', [
        'exam_id' => $exam->id,
        'device_id' => 'device_id_555',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true);

    $session = ExamSession::first();
    expect($session->status)->toBe('active');

    // 4. Send Heartbeat
    $response = $this->postJson("/api/session/{$session->id}/heartbeat", [
        'battery_level' => 90,
        'ram_usage_pct' => 50,
        'ping_ms' => 15,
        'current_question_index' => 2,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('is_locked', false);

    $session->refresh();
    expect($session->battery_level)->toBe(90)
        ->and($session->current_question_index)->toBe(2);

    // 5. Submit log
    $response = $this->postJson("/api/session/{$session->id}/log", [
        'event_type' => 'app_switch',
        'message' => 'Candidate switches view to home screen.',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('device_logs', [
        'event_type' => 'app_switch',
        'message' => 'Candidate switches view to home screen.',
    ]);

    // 6. Report Violation
    $response = $this->postJson("/api/session/{$session->id}/violation", [
        'type' => 'screenshot',
        'severity' => 'medium',
        'details' => 'Screenshot capture attempted.',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('violations', [
        'type' => 'screenshot',
        'severity' => 'medium',
    ]);

    // 7. Submit exam
    $response = $this->postJson("/api/session/{$session->id}/submit");
    $response->assertStatus(200);

    $session->refresh();
    expect($session->status)->toBe('finished');
});

test('can retrieve app configuration and verify status and updates', function () {
    $config = AndroidConfiguration::create([
        'base_url' => 'https://exam.smpn4ngantang.sch.id',
        'api_url' => 'https://exam.smpn4ngantang.sch.id/api',
        'exam_url' => 'https://exam.smpn4ngantang.sch.id/join',
        'min_version' => '1.1.0',
        'latest_version' => '1.2.0',
        'force_update' => true,
        'maintenance_mode' => false,
        'lock_mode' => false,
        'heartbeat_interval_seconds' => 5,
        'cache_policy' => 'clear_on_exit',
        'broadcast_message' => 'Good luck with your exam!',
    ]);

    // Test Config Retrieval
    $response = $this->getJson('/api/config');
    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('config.base_url', 'https://exam.smpn4ngantang.sch.id')
        ->assertJsonPath('config.min_version', '1.1.0');

    // Test Update Check (Update Required - client version < min_version)
    $response = $this->postJson('/api/config/check-update', [
        'version_name' => '1.0.0',
    ]);
    $response->assertStatus(200)
        ->assertJsonPath('update_required', true)
        ->assertJsonPath('update_available', true);

    // Test Update Check (Update Available - min_version <= client version < latest_version)
    $response = $this->postJson('/api/config/check-update', [
        'version_name' => '1.1.5',
    ]);
    $response->assertStatus(200)
        ->assertJsonPath('update_required', false)
        ->assertJsonPath('update_available', true);

    // Test Update Check (Up to date - client version >= latest_version)
    $response = $this->postJson('/api/config/check-update', [
        'version_name' => '1.2.0',
    ]);
    $response->assertStatus(200)
        ->assertJsonPath('update_required', false)
        ->assertJsonPath('update_available', false);

    // Test Status and Broadcast message
    $response = $this->getJson('/api/config/status');
    $response->assertStatus(200)
        ->assertJsonPath('maintenance_mode', false)
        ->assertJsonPath('broadcast_message', 'Good luck with your exam!');
});
