<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\SecurityPolicy;
use App\Models\User;
use App\Models\WhitelistUrl;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admins / Proctors
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@seb.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $proctor = User::create([
            'name' => 'Proctor Budi',
            'email' => 'proctor@seb.com',
            'password' => Hash::make('password'),
            'role' => 'proctor',
        ]);

        // Create some student users
        $students = [];
        for ($i = 1; $i <= 5; $i++) {
            $students[] = User::create([
                'name' => "Student $i",
                'email' => "student$i@seb.com",
                'password' => Hash::make('password'),
                'role' => 'student',
            ]);
        }

        // 2. Create Security Policy
        $policy = SecurityPolicy::create([
            'name' => 'Strict Exam Protocol',
            'violation_weights' => [
                'root_detected' => 'critical',
                'emulator_detected' => 'critical',
                'app_switch' => 'heavy',
                'screenshot' => 'medium',
                'usb_debugging' => 'heavy',
                'developer_mode' => 'light',
                'screen_record' => 'heavy',
            ],
            'allow_emulator' => false,
            'allow_developer_mode' => false,
        ]);

        // 3. Create Exam
        $exam = Exam::create([
            'title' => 'Ujian Akhir Semester - Matematika',
            'description' => 'Ujian Matematika Semester Genap Tingkat Menengah Atas.',
            'token' => 'MATH101',
            'duration_minutes' => 90,
            'start_time' => now()->subHour(),
            'end_time' => now()->addHours(3),
            'is_active' => true,
            'randomize_questions' => true,
            'auto_submit' => true,
            'security_policy_id' => $policy->id,
        ]);

        // 4. Create Whitelist URLs
        WhitelistUrl::create([
            'exam_id' => $exam->id,
            'url_pattern' => 'https://wayground.com/join*',
        ]);
        WhitelistUrl::create([
            'exam_id' => $exam->id,
            'url_pattern' => 'https://cdn.seb.com/*',
        ]);

        // 5. Create Questions
        $q1 = Question::create([
            'exam_id' => $exam->id,
            'question_text' => 'Berapakah hasil dari 25 x 4 + 50?',
            'options' => ['100', '150', '200', '250'],
            'correct_option' => '150',
        ]);

        $q2 = Question::create([
            'exam_id' => $exam->id,
            'question_text' => 'Berapakah nilai x pada persamaan 3x + 6 = 18?',
            'options' => ['2', '4', '6', '8'],
            'correct_option' => '4',
        ]);

        $q3 = Question::create([
            'exam_id' => $exam->id,
            'question_text' => 'Nilai dari cos(0) adalah...',
            'options' => ['-1', '0', '1/2', '1'],
            'correct_option' => '1',
        ]);

        // 6. Create Devices
        $device1 = Device::create([
            'device_id' => 'device_android_hash_1',
            'brand' => 'Samsung',
            'model' => 'Galaxy S21',
            'os_version' => 'Android 13',
            'ram_mb' => 8192,
            'storage_mb' => 131072,
            'ip_address' => '192.168.1.50',
            'mac_address' => 'AA:BB:CC:DD:EE:01',
            'app_version' => '1.0.0',
            'is_rooted' => false,
            'is_developer_mode' => false,
            'is_usb_debugging' => false,
            'is_emulator' => false,
            'is_locked' => false,
        ]);

        $device2 = Device::create([
            'device_id' => 'device_android_hash_2',
            'brand' => 'Xiaomi',
            'model' => 'Poco X3 Pro',
            'os_version' => 'Android 12',
            'ram_mb' => 6144,
            'storage_mb' => 131072,
            'ip_address' => '192.168.1.51',
            'mac_address' => 'AA:BB:CC:DD:EE:02',
            'app_version' => '1.0.0',
            'is_rooted' => true,
            'is_developer_mode' => true,
            'is_usb_debugging' => true,
            'is_emulator' => false,
            'is_locked' => false,
        ]);

        // 7. Create active exam sessions
        ExamSession::create([
            'user_id' => $students[0]->id,
            'exam_id' => $exam->id,
            'device_id' => $device1->id,
            'status' => 'active',
            'started_at' => now()->subMinutes(10),
            'current_question_index' => 1,
            'last_known_ip' => '192.168.1.50',
            'battery_level' => 85,
            'ram_usage_pct' => 45,
            'ping_ms' => 12,
        ]);

        $session2 = ExamSession::create([
            'user_id' => $students[1]->id,
            'exam_id' => $exam->id,
            'device_id' => $device2->id,
            'status' => 'active',
            'started_at' => now()->subMinutes(5),
            'current_question_index' => 0,
            'last_known_ip' => '192.168.1.51',
            'battery_level' => 62,
            'ram_usage_pct' => 80,
            'ping_ms' => 45,
        ]);

        // Add some mock violations/logs for Student 2
        $session2->violations()->create([
            'type' => 'root_detected',
            'severity' => 'critical',
            'details' => 'Device is rooted with Magisk SU binary detected.',
            'detected_at' => now()->subMinutes(4),
        ]);

        $session2->violations()->create([
            'type' => 'screenshot',
            'severity' => 'medium',
            'details' => 'Screenshot attempt captured in WebView.',
            'detected_at' => now()->subMinutes(2),
        ]);

        $session2->deviceLogs()->create([
            'event_type' => 'login',
            'message' => 'Logged in successfully.',
            'occurred_at' => now()->subMinutes(5),
        ]);

        $session2->deviceLogs()->create([
            'event_type' => 'start_exam',
            'message' => 'Started exam session.',
            'occurred_at' => now()->subMinutes(5),
        ]);

        $session2->deviceLogs()->create([
            'event_type' => 'app_switch',
            'message' => 'Exited secure app view, switched to background.',
            'occurred_at' => now()->subMinutes(3),
        ]);
    }
}
