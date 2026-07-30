<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamApiController extends Controller
{
    /**
     * List active exams.
     */
    public function index(): JsonResponse
    {
        $exams = Exam::where('is_active', true)
            ->with(['securityPolicy'])
            ->get();

        return response()->json([
            'success' => true,
            'exams' => $exams,
        ]);
    }

    /**
     * Join an exam using a token/PIN.
     */
    public function join(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'device_id' => 'required|string',
        ]);

        $exam = Exam::where('token', $validated['token'])
            ->where('is_active', true)
            ->with(['securityPolicy', 'whitelistUrls'])
            ->first();

        if (! $exam) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid exam token or exam is inactive.',
            ], 404);
        }

        // Hide correct option in client payload for security
        $questions = $exam->questions()->get()->map(function ($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'options' => $q->options,
            ];
        });

        return response()->json([
            'success' => true,
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'whitelist_urls' => $exam->whitelistUrls->pluck('url_pattern'),
                'security_policy' => $exam->securityPolicy,
                'questions' => $questions,
            ],
        ]);
    }
}
