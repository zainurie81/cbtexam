<?php

namespace App\Http\Controllers;

use App\Events\ExamActivityBroadcast;
use App\Models\AndroidConfiguration;
use App\Models\Device;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\SecurityPolicy;
use App\Models\Violation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the main stats dashboard.
     */
    public function index(): Response
    {
        $sessions = ExamSession::with(['user', 'exam', 'device'])->get();
        $exams = Exam::with(['securityPolicy'])->get();
        $devices = Device::all();
        $violations = Violation::with(['examSession.user'])->latest()->take(10)->get();

        return Inertia::render('dashboard', [
            'sessions' => $sessions,
            'exams' => $exams,
            'devices' => $devices,
            'latestViolations' => $violations,
        ]);
    }

    /**
     * Real-time monitoring board.
     */
    public function monitoring(): Response
    {
        $sessions = ExamSession::where('status', 'active')
            ->with(['user', 'exam', 'device', 'violations', 'deviceLogs'])
            ->get();

        return Inertia::render('monitoring/dashboard', [
            'activeSessions' => $sessions,
        ]);
    }

    /**
     * Manage Devices.
     */
    public function devices(): Response
    {
        $devices = Device::with(['examSessions.user'])->get();

        return Inertia::render('admin/devices', [
            'devices' => $devices,
        ]);
    }

    /**
     * Manage configuration.
     */
    public function config(): Response
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

        $policy = SecurityPolicy::first();
        if (! $policy) {
            $policy = SecurityPolicy::create([
                'name' => 'Default Policy',
                'violation_weights' => [
                    'root_detected' => 'critical',
                    'emulator_detected' => 'critical',
                    'app_switch' => 'heavy',
                    'screenshot' => 'medium',
                    'usb_debugging' => 'heavy',
                    'developer_mode' => 'light',
                ],
            ]);
        }

        return Inertia::render('admin/android-config', [
            'config' => $config,
            'policy' => $policy,
        ]);
    }

    /**
     * Update configuration parameters.
     */
    public function updateConfig(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'base_url' => 'required|url',
            'api_url' => 'required|url',
            'exam_url' => 'required|url',
            'min_version' => 'required|string',
            'latest_version' => 'required|string',
            'force_update' => 'required|boolean',
            'maintenance_mode' => 'required|boolean',
            'lock_mode' => 'required|boolean',
            'heartbeat_interval_seconds' => 'required|integer|min:2',
            'cache_policy' => 'required|string',
            'broadcast_message' => 'nullable|string',
        ]);

        $config = AndroidConfiguration::firstOrCreate([]);
        $config->update($validated);

        return redirect()->back();
    }

    /**
     * Update security policy violation weights.
     */
    public function updatePolicy(Request $request, SecurityPolicy $policy): RedirectResponse
    {
        $validated = $request->validate([
            'violation_weights' => 'required|array',
            'allow_emulator' => 'required|boolean',
            'allow_developer_mode' => 'required|boolean',
        ]);

        $policy->update($validated);

        return redirect()->back();
    }

    /**
     * Toggle lock state of a device.
     */
    public function toggleDeviceLock(Device $device): JsonResponse
    {
        $device->update([
            'is_locked' => ! $device->is_locked,
        ]);

        // If locked, broadcast to active sessions
        $activeSession = ExamSession::where('device_id', $device->id)
            ->where('status', 'active')
            ->first();

        if ($activeSession) {
            event(new ExamActivityBroadcast($activeSession, 'status_change', [
                'message' => $device->is_locked ? 'Device locked by administrator.' : 'Device unlocked by administrator.',
                'action' => $device->is_locked ? 'lock' : 'unlock',
            ]));
        }

        return response()->json([
            'success' => true,
            'device' => $device,
        ]);
    }

    /**
     * Kick candidate / end session.
     */
    public function kickSession(ExamSession $session): JsonResponse
    {
        $session->update([
            'status' => 'finished',
            'finished_at' => now(),
        ]);

        event(new ExamActivityBroadcast($session, 'status_change', [
            'message' => 'Candidate kicked by proctor.',
            'action' => 'kick',
        ]));

        return response()->json([
            'success' => true,
            'session' => $session,
        ]);
    }
}
