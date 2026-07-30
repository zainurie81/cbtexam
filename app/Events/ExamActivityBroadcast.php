<?php

namespace App\Events;

use App\Models\ExamSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamActivityBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public ExamSession $examSession,
        public string $type, // 'heartbeat', 'violation', 'log', 'status_change'
        public array $data = []
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('monitoring'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->examSession->id,
            'student_name' => $this->examSession->user->name,
            'exam_title' => $this->examSession->exam->title,
            'device' => $this->examSession->device ? [
                'brand' => $this->examSession->device->brand,
                'model' => $this->examSession->device->model,
                'is_locked' => $this->examSession->device->is_locked,
            ] : null,
            'type' => $this->type,
            'status' => $this->examSession->status,
            'battery_level' => $this->examSession->battery_level,
            'ram_usage_pct' => $this->examSession->ram_usage_pct,
            'ping_ms' => $this->examSession->ping_ms,
            'current_question_index' => $this->examSession->current_question_index,
            'data' => $this->data,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
