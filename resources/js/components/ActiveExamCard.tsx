import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, Battery, Wifi, Cpu, AppWindow, Play, UserX, Lock, Unlock } from 'lucide-react';
import type { User } from '@/types';

export interface ExamSessionData {
    id: number;
    user: User;
    exam: {
        id: number;
        title: string;
    };
    device?: {
        id: number;
        device_id: string;
        brand: string;
        model: string;
        os_version: string;
        is_rooted: boolean;
        is_developer_mode: boolean;
        is_usb_debugging: boolean;
        is_emulator: boolean;
        is_locked: boolean;
    };
    status: string;
    current_question_index: number;
    battery_level: number;
    ram_usage_pct: number;
    ping_ms: number;
    violations: Array<{
        id: number;
        type: string;
        severity: string;
        details: string;
        detected_at: string;
    }>;
}

interface ActiveExamCardProps {
    session: ExamSessionData;
    onViewDetail: (session: ExamSessionData) => void;
    onToggleLock: (deviceId: number) => void;
    onKick: (sessionId: number) => void;
}

export function ActiveExamCard({ session, onViewDetail, onToggleLock, onKick }: ActiveExamCardProps) {
    const violationCount = session.violations ? session.violations.length : 0;
    const isCritical = violationCount > 0 || (session.device && (session.device.is_rooted || session.device.is_emulator));
    
    // Status Badge Color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
            case 'paused': return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
            case 'finished': return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
            default: return 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
        }
    };

    return (
        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-md border ${
            isCritical ? 'border-rose-500/40 bg-rose-500/5' : 'border-zinc-200 dark:border-zinc-800'
        }`}>
            {/* Top Indicator Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                isCritical ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />

            <CardHeader className="pt-5 pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-bold truncate max-w-[180px]">
                            {session.user.name}
                        </CardTitle>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{session.user.email}</p>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(session.status)} capitalize text-[10px] py-0.5 px-2`}>
                        {session.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-3">
                {/* Device Info */}
                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded p-2 flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {session.device ? `${session.device.brand} ${session.device.model}` : 'Unknown Device'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-500 font-mono">
                        v{session.device?.os_version || 'N/A'}
                    </span>
                </div>

                {/* Health Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <Battery className={`h-4 w-4 mb-1 ${session.battery_level < 20 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
                        <span className="font-bold">{session.battery_level}%</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Battery</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <Wifi className={`h-4 w-4 mb-1 ${session.ping_ms > 100 ? 'text-amber-500' : 'text-zinc-500'}`} />
                        <span className="font-bold">{session.ping_ms}ms</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Ping</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <Cpu className={`h-4 w-4 mb-1 ${session.ram_usage_pct > 80 ? 'text-rose-500' : 'text-zinc-500'}`} />
                        <span className="font-bold">{session.ram_usage_pct}%</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wide">RAM</span>
                    </div>
                </div>

                {/* Progress Details */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Current Question</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">#{session.current_question_index + 1}</span>
                    </div>
                </div>

                {/* Violations Block */}
                <div className="flex items-center justify-between border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-3">
                    <div className="flex items-center space-x-1.5">
                        {violationCount > 0 ? (
                            <ShieldAlert className="h-4 w-4 text-rose-500 animate-bounce" />
                        ) : (
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="text-xs font-semibold">
                            {violationCount > 0 ? `${violationCount} Violations` : 'No violations'}
                        </span>
                    </div>
                    {session.device?.is_locked && (
                        <Badge variant="destructive" className="animate-pulse bg-rose-600 text-white border-0 text-[10px] py-0.5 px-2">
                            LOCKED
                        </Badge>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 px-4 py-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onViewDetail(session)}>
                    <AppWindow className="h-3.5 w-3.5 mr-1" />
                    Details
                </Button>
                
                {session.device && (
                    <Button 
                        size="sm" 
                        variant={session.device.is_locked ? 'default' : 'outline'} 
                        className={`h-8 px-2.5 ${session.device.is_locked ? 'bg-amber-600 hover:bg-amber-700' : 'text-zinc-600 hover:text-zinc-800'}`}
                        onClick={() => onToggleLock(session.device!.id)}
                        title={session.device.is_locked ? 'Unlock Device' : 'Lock Device'}
                    >
                        {session.device.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                )}

                <Button 
                    size="sm" 
                    variant="destructive" 
                    className="h-8 px-2.5"
                    onClick={() => onKick(session.id)}
                    title="Kick Candidate"
                >
                    <UserX className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
