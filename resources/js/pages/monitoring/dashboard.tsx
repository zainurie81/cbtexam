import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ActiveExamCard, type ExamSessionData } from '@/components/ActiveExamCard';
import { SessionDetailModal } from '@/components/SessionDetailModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, Users, Search, AlertCircle, RefreshCcw, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface MonitoringDashboardProps {
    activeSessions: ExamSessionData[];
}

interface AlertLog {
    id: string;
    studentName: string;
    message: string;
    severity: 'light' | 'medium' | 'heavy' | 'critical' | 'info';
    time: string;
}

export default function MonitoringDashboard({ activeSessions: initialSessions }: MonitoringDashboardProps) {
    const [sessions, setSessions] = useState<ExamSessionData[]>(initialSessions);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState<ExamSessionData | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [alerts, setAlerts] = useState<AlertLog[]>([
        { id: '1', studentName: 'System', message: 'Real-time monitoring console ready.', severity: 'info', time: new Date().toLocaleTimeString() }
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter sessions based on search
    const filteredSessions = sessions.filter(session => 
        session.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.device && session.device.model.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Count statistics
    const totalCandidates = sessions.length;
    const lockedCount = sessions.filter(s => s.device?.is_locked).length;
    const totalViolations = sessions.reduce((acc, curr) => acc + (curr.violations ? curr.violations.length : 0), 0);
    const criticalCandidates = sessions.filter(s => 
        (s.violations && s.violations.length > 0) || 
        (s.device && (s.device.is_rooted || s.device.is_emulator))
    ).length;

    // Simulate WebSocket event pushes periodically to showcase real-time interface capabilities
    useEffect(() => {
        const simulationInterval = setInterval(() => {
            if (sessions.length === 0) return;
            
            // Randomly pick a session to update
            const randomIndex = Math.floor(Math.random() * sessions.length);
            const targetSession = sessions[randomIndex];
            
            // Randomly update ping/battery or trigger violation
            const updateType = Math.random() > 0.7 ? 'violation' : 'metrics';
            
            setSessions(prevSessions => {
                return prevSessions.map((s, idx) => {
                    if (idx !== randomIndex) return s;
                    
                    if (updateType === 'violation') {
                        const violationTypes = [
                            { type: 'app_switch', severity: 'heavy', details: 'Candidate exited secure app context.' },
                            { type: 'screenshot', severity: 'medium', details: 'Attempted to capture WebView contents.' },
                            { type: 'developer_mode', severity: 'light', details: 'Developer mode activated during session.' },
                        ];
                        const chosenViolation = violationTypes[Math.floor(Math.random() * violationTypes.length)];
                        const newViolation = {
                            id: Date.now(),
                            type: chosenViolation.type,
                            severity: chosenViolation.severity,
                            details: chosenViolation.details,
                            detected_at: new Date().toISOString(),
                        };
                        
                        // Add alert log
                        const alertSeverity = chosenViolation.severity as any;
                        setAlerts(prev => [
                            {
                                id: String(Date.now()),
                                studentName: s.user.name,
                                message: chosenViolation.details,
                                severity: alertSeverity,
                                time: new Date().toLocaleTimeString(),
                            },
                            ...prev.slice(0, 19)
                        ]);
                        
                        toast.error(`Violation Detected: ${s.user.name} - ${chosenViolation.details}`);
                        
                        return {
                            ...s,
                            violations: [...(s.violations || []), newViolation]
                        };
                    } else {
                        // Just update metrics
                        const pingDiff = Math.floor(Math.random() * 20) - 10;
                        const batteryDiff = Math.random() > 0.8 ? -1 : 0;
                        return {
                            ...s,
                            ping_ms: Math.max(5, s.ping_ms + pingDiff),
                            battery_level: Math.max(5, s.battery_level + batteryDiff),
                            ram_usage_pct: Math.min(95, Math.max(10, s.ram_usage_pct + Math.floor(Math.random() * 6) - 3))
                        };
                    }
                });
            });
        }, 8000);

        return () => clearInterval(simulationInterval);
    }, [sessions]);

    // Fast Polling update to sync with real server state
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['activeSessions'],
                onSuccess: (page) => {
                    setSessions(page.props.activeSessions as ExamSessionData[]);
                }
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Action handlers
    const handleViewDetail = (session: ExamSessionData) => {
        setSelectedSession(session);
        setDetailModalOpen(true);
    };

    const handleToggleLock = (deviceId: number) => {
        router.post(`/api/web/devices/${deviceId}/toggle-lock`, {}, {
            onSuccess: (page) => {
                toast.success('Device lock state toggled.');
                const updatedSessions = sessions.map(s => {
                    if (s.device && s.device.id === deviceId) {
                        return {
                            ...s,
                            device: { ...s.device, is_locked: !s.device.is_locked }
                        };
                    }
                    return s;
                });
                setSessions(updatedSessions);
                if (selectedSession && selectedSession.device?.id === deviceId) {
                    setSelectedSession({
                        ...selectedSession,
                        device: { ...selectedSession.device, is_locked: !selectedSession.device.is_locked }
                    });
                }
            }
        });
    };

    const handleKick = (sessionId: number) => {
        if (!confirm('Are you sure you want to kick this candidate? Their session will be forced to submit immediately.')) return;
        
        router.post(`/api/web/sessions/${sessionId}/kick`, {}, {
            onSuccess: () => {
                toast.warning('Candidate has been kicked from the exam.');
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                setDetailModalOpen(false);
            }
        });
    };

    const getAlertColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400';
            case 'heavy': return 'border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400';
            case 'medium': return 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400';
            case 'light': return 'border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400';
            default: return 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400';
        }
    };

    return (
        <>
            <Head title="Live Exam Monitoring" />

            <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Live Exam Monitoring</h1>
                            <p className="text-sm text-zinc-500">Real-time status, hardware diagnostics, and anti-cheat supervision dashboard.</p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input 
                                    placeholder="Search student..." 
                                    className="pl-8 w-full sm:w-[260px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => router.reload()} title="Force Sync">
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Metric Panel */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Candidates</span>
                                <span className="text-2xl font-black">{totalCandidates}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Total Violations</span>
                                <span className="text-2xl font-black text-rose-500">{totalViolations}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">At Risk</span>
                                <span className="text-2xl font-black text-amber-500">{criticalCandidates}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-zinc-500/10 text-zinc-500">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Locked Devices</span>
                                <span className="text-2xl font-black">{lockedCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Cards Grid */}
                    {filteredSessions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredSessions.map(session => (
                                <ActiveExamCard
                                    key={session.id}
                                    session={session}
                                    onViewDetail={handleViewDetail}
                                    onToggleLock={handleToggleLock}
                                    onKick={handleKick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                            <Users className="h-12 w-12 text-zinc-300 mb-3" />
                            <h3 className="font-bold text-base">No active candidates</h3>
                            <p className="text-xs text-zinc-500 max-w-[280px] mt-1">There are no candidates currently taking the exam matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Live Real-time Violation Alert Side Panel */}
                <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col h-full">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-indigo-500 animate-pulse" />
                            <h2 className="text-sm font-bold">Real-time Activity Stream</h2>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold">LIVE</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {alerts.map(alert => (
                            <div 
                                key={alert.id} 
                                className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${getAlertColor(alert.severity)}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{alert.studentName}</span>
                                    <span className="text-[9px] font-mono opacity-80">{alert.time}</span>
                                </div>
                                <p className="opacity-95">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Candidate Session Details Modal */}
            <SessionDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                session={selectedSession}
                onToggleLock={handleToggleLock}
                onKick={handleKick}
            />
        </>
    );
}

MonitoringDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Real-time Monitoring', href: '/dashboard/monitoring' }
    ]
};
