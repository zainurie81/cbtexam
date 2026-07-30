<?php

namespace App\Http\Controllers\Api;

use App\Events\ExamActivityBroadcast;
use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Exam;
use App\Models\ExamSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SessionApiController extends Controller
{
    /**
     * Start/Resume an exam session.
     */
    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'device_id' => 'required|string',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $device = Device::where('device_id', $validated['device_id'])->first();
        if (! $device) {
            return response()->json(['success' => false, 'message' => 'Device not registered.'], 404);
        }

        // Check if device is locked by administrator
        if ($device->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'This device is locked by the administrator. Contact your proctor.',
            ], 403);
        }

        // Find or create session
        $session = ExamSession::firstOrCreate([
            'user_id' => $user->id,
            'exam_id' => $validated['exam_id'],
        ], [
            'device_id' => $device->id,
            'status' => 'active',
            'started_at' => now(),
            'current_question_index' => 0,
        ]);

        if ($session->status === 'finished') {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted this exam.',
            ], 403);
        }

        // Update status to active and device association
        $session->update([
            'status' => 'active',
            'device_id' => $device->id,
        ]);

        $session->load(['user', 'exam', 'device']);

        event(new ExamActivityBroadcast($session, 'status_change', ['message' => 'Student started/resumed the exam.']));

        return response()->json([
            'success' => true,
            'session' => $session,
        ]);
    }

    /**
     * Heartbeat update from candidate.
     */
    public function heartbeat(Request $request, ExamSession $session): JsonResponse
    {
        $validated = $request->validate([
            'battery_level' => 'nullable|integer',
            'ram_usage_pct' => 'nullable|integer',
            'ping_ms' => 'nullable|integer',
            'current_question_index' => 'nullable|integer',
            'status' => 'nullable|string',
        ]);

        // Check lock status
        if ($session->device && $session->device->is_locked) {
            return response()->json([
                'success' => false,
                'is_locked' => true,
                'message' => 'Device is locked by administrator.',
            ], 403);
        }

        $session->update(array_filter([
            'battery_level' => $validated['battery_level'] ?? null,
            'ram_usage_pct' => $validated['ram_usage_pct'] ?? null,
            'ping_ms' => $validated['ping_ms'] ?? null,
            'current_question_index' => $validated['current_question_index'] ?? null,
            'status' => $validated['status'] ?? $session->status,
            'last_known_ip' => $request->ip(),
        ]));

        $session->load(['user', 'exam', 'device']);

        event(new ExamActivityBroadcast($session, 'heartbeat'));

        return response()->json([
            'success' => true,
            'is_locked' => false,
        ]);
    }

    /**
     * Log custom event from device.
     */
    public function log(Request $request, ExamSession $session): JsonResponse
    {
        $validated = $request->validate([
            'event_type' => 'required|string',
            'message' => 'required|string',
            'occurred_at' => 'nullable|date',
        ]);

        $log = $session->deviceLogs()->create([
            'event_type' => $validated['event_type'],
            'message' => $validated['message'],
            'occurred_at' => $validated['occurred_at'] ?? now(),
        ]);

        $session->load(['user', 'exam', 'device']);

        event(new ExamActivityBroadcast($session, 'log', [
            'event_type' => $log->event_type,
            'message' => $log->message,
        ]));

        return response()->json(['success' => true]);
    }

    /**
     * Report anti-cheat violation.
     */
    public function violation(Request $request, ExamSession $session): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'severity' => 'required|string',
            'details' => 'required|string',
            'screenshot' => 'nullable|image|max:2048', // max 2MB
        ]);

        $screenshotPath = null;
        if ($request->hasFile('screenshot')) {
            $screenshotPath = $request->file('screenshot')->store('screenshots', 'public');
        }

        $violation = $session->violations()->create([
            'type' => $validated['type'],
            'severity' => $validated['severity'],
            'details' => $validated['details'],
            'screenshot_path' => $screenshotPath ? Storage::url($screenshotPath) : null,
            'detected_at' => now(),
        ]);

        $session->load(['user', 'exam', 'device']);

        event(new ExamActivityBroadcast($session, 'violation', [
            'type' => $violation->type,
            'severity' => $violation->severity,
            'details' => $violation->details,
            'screenshot_url' => $violation->screenshot_path,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Violation logged.',
        ]);
    }

    /**
     * Submit/Finish exam.
     */
    public function submit(Request $request, ExamSession $session): JsonResponse
    {
        $session->update([
            'status' => 'finished',
            'finished_at' => now(),
        ]);

        $session->load(['user', 'exam', 'device']);

        event(new ExamActivityBroadcast($session, 'status_change', ['message' => 'Student submitted the exam.']));

        return response()->json([
            'success' => true,
            'message' => 'Exam session completed successfully.',
        ]);
    }
}
