import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, ListTodo, Activity, Image as ImageIcon, Lock, Unlock, UserX } from 'lucide-react';
import type { ExamSessionData } from '@/components/ActiveExamCard';

interface SessionDetailModalProps {
    session: ExamSessionData | null;
    isOpen: boolean;
    onClose: () => void;
    onToggleLock: (deviceId: number) => void;
    onKick: (sessionId: number) => void;
}

export function SessionDetailModal({ session, isOpen, onClose, onToggleLock, onKick }: SessionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'activity' | 'violations' | 'device'>('activity');

    if (!session) return null;

    const violationCount = session.violations ? session.violations.length : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-y-auto max-h-[90vh] border border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {session.user.name}
                                <Badge className="text-xs capitalize py-0 px-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                    {session.exam.title}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-1">
                                Device Hardware ID: <span className="font-mono">{session.device?.device_id || 'N/A'}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Custom Tab Selection Header */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 w-full mt-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'activity' 
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                        <Activity className="h-4 w-4" />
                        Live Activity
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('violations')}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'violations' 
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Violations ({violationCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('device')}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'device' 
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                        <ListTodo className="h-4 w-4" />
                        Device Metrics & Actions
                    </button>
                </div>

                {/* Tab: Activity Timeline */}
                {activeTab === 'activity' && (
                    <div className="space-y-4 py-4">
                        <div className="border border-zinc-100 dark:border-zinc-900 rounded-lg p-4 bg-zinc-50/50 dark:bg-zinc-950/20 max-h-[350px] overflow-y-auto">
                            {session.deviceLogs && session.deviceLogs.length > 0 ? (
                                <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-6">
                                    {session.deviceLogs.map((log: any, idx: number) => (
                                        <div key={idx} className="relative">
                                            {/* Dot */}
                                            <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-zinc-950" />
                                            
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <span className="text-xs font-bold font-mono uppercase bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded">
                                                        {log.event_type}
                                                    </span>
                                                    <p className="text-sm font-medium mt-1.5 text-zinc-700 dark:text-zinc-300">
                                                        {log.message}
                                                    </p>
                                                </div>
                                                <time className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                                                    {new Date(log.occurred_at || log.created_at).toLocaleTimeString()}
                                                </time>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-zinc-500 py-6">No activity logs recorded yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Violations */}
                {activeTab === 'violations' && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                            {session.violations && session.violations.length > 0 ? (
                                session.violations.map((violation: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                                            violation.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20' : 
                                            violation.severity === 'heavy' ? 'bg-orange-500/5 border-orange-500/20' : 
                                            'bg-amber-500/5 border-amber-500/20'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`capitalize text-[10px] py-0.5 px-2 ${
                                                    violation.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 
                                                    violation.severity === 'heavy' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                }`}>
                                                    {violation.severity}
                                                </Badge>
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                    {violation.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                                {violation.details}
                                            </p>
                                            <span className="text-[10px] text-zinc-400 block font-mono">
                                                {new Date(violation.detected_at).toLocaleString()}
                                            </span>
                                        </div>

                                        {violation.screenshot_path && (
                                            <a 
                                                href={violation.screenshot_path} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                                View Screen
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-600">
                                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                                    <p className="font-bold text-sm">Perfect Record</p>
                                    <p className="text-xs opacity-90 mt-0.5">No anti-cheat rules have been breached.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Device Metrics & Actions */}
                {activeTab === 'device' && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Specifications */}
                            <div className="space-y-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Hardware Specifications</h4>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">Brand / Model</span>
                                        <span className="font-semibold">{session.device?.brand || 'N/A'} {session.device?.model || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">RAM Memory</span>
                                        <span className="font-semibold">{session.device?.ram_mb ? `${Math.round(session.device.ram_mb / 1024)} GB` : 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">Storage Memory</span>
                                        <span className="font-semibold">{session.device?.storage_mb ? `${Math.round(session.device.storage_mb / 1024)} GB` : 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">IP Address</span>
                                        <span className="font-mono font-semibold">{session.device?.ip_address || 'N/A'}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Cheat Check */}
                            <div className="space-y-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cheat Check Checklist</h4>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">Root Status</span>
                                        <span className={`font-semibold ${session.device?.is_rooted ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {session.device?.is_rooted ? 'ROOTED' : 'SECURE'}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">Developer Options</span>
                                        <span className={`font-semibold ${session.device?.is_developer_mode ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {session.device?.is_developer_mode ? 'ENABLED' : 'SECURE'}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">USB Debugging</span>
                                        <span className={`font-semibold ${session.device?.is_usb_debugging ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {session.device?.is_usb_debugging ? 'ACTIVE' : 'SECURE'}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-zinc-500">Emulator System</span>
                                        <span className={`font-semibold ${session.device?.is_emulator ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {session.device?.is_emulator ? 'EMULATOR' : 'REAL DEVICE'}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Proctor Controls */}
                        <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-4 space-y-3 mt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Proctor Destructive Actions</h4>
                            <p className="text-xs text-zinc-500">These commands will override the candidate device immediately.</p>
                            
                            <div className="flex gap-3">
                                {session.device && (
                                    <Button 
                                        variant={session.device.is_locked ? 'default' : 'outline'} 
                                        size="sm"
                                        className={session.device.is_locked ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                                        onClick={() => onToggleLock(session.device!.id)}
                                    >
                                        {session.device.is_locked ? <Unlock className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
                                        {session.device.is_locked ? 'Unlock Client App' : 'Lock Client App'}
                                    </Button>
                                )}
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => onKick(session.id)}
                                >
                                    <UserX className="h-4 w-4 mr-1.5" />
                                    Kick Candidate Session
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
