import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, Users, Play, Smartphone, AlertCircle } from 'lucide-react';
import type { ExamSessionData } from '@/components/ActiveExamCard';

interface DashboardProps {
    sessions: ExamSessionData[];
    exams: any[];
    devices: any[];
    latestViolations: any[];
}

export default function Dashboard({ sessions, exams, devices, latestViolations }: DashboardProps) {
    const totalCandidates = sessions.length;
    const activeCandidates = sessions.filter(s => s.status === 'active').length;
    const finishedCandidates = sessions.filter(s => s.status === 'finished').length;
    const totalViolations = latestViolations.length;
    const rootedCount = devices.filter(d => d.is_rooted).length;

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="p-6 space-y-6">
                {/* Upper Greeting Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-600 dark:bg-indigo-950 p-6 rounded-2xl text-white shadow gap-4">
                    <div>
                        <h1 className="text-2xl font-black">Secure Exam Browser (SEB) Admin Console</h1>
                        <p className="text-sm opacity-90 mt-1">Supervise candidate applications, configure anti-cheat policies, and lock compromised devices.</p>
                    </div>
                    <Button asChild className="bg-white hover:bg-zinc-100 text-indigo-700 font-bold self-start md:self-auto">
                        <Link href="/dashboard/monitoring">
                            <Play className="h-4 w-4 mr-1.5 fill-current" />
                            Start Live Monitoring
                        </Link>
                    </Button>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Active Candidates</CardDescription>
                            <CardTitle className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                {activeCandidates} <span className="text-sm text-zinc-500 font-normal">/ {totalCandidates} total</span>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Completed Exams</CardDescription>
                            <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {finishedCandidates}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Devices</CardDescription>
                            <CardTitle className="text-3xl font-black text-zinc-800 dark:text-zinc-100">
                                {devices.length}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase tracking-wider font-bold">Rooted Devices</CardDescription>
                            <CardTitle className="text-3xl font-black text-rose-600 dark:text-rose-400">
                                {rootedCount}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Two Column Layout for details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Active Exams List */}
                    <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Current Exams</CardTitle>
                            <CardDescription>All scheduled and active tests overseen by the security policy.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {exams.length > 0 ? (
                                exams.map(exam => (
                                    <div key={exam.id} className="flex justify-between items-center p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{exam.title}</h3>
                                                <Badge className="text-[10px] font-mono py-0 px-2" variant={exam.is_active ? 'default' : 'secondary'}>
                                                    {exam.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-zinc-500">{exam.description || 'No description provided.'}</p>
                                            <span className="text-[10px] text-zinc-400 font-mono block">Pin Access Code: {exam.token || 'N/A'}</span>
                                        </div>

                                        <div className="text-right space-y-1.5">
                                            <span className="text-xs font-semibold block text-zinc-700 dark:text-zinc-300">{exam.duration_minutes} Mins</span>
                                            <Badge variant="outline" className="text-[9px] py-0 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                                                {exam.security_policy ? exam.security_policy.name : 'No Policy'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 text-center py-6">No exams created yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column: Latest Violations Feed */}
                    <Card className="border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Security Alerts Feed</CardTitle>
                            <CardDescription>Most recent candidate integrity violations detected in app.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                            {totalViolations > 0 ? (
                                latestViolations.map(violation => (
                                    <div key={violation.id} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                {violation.exam_session?.user?.name || 'Candidate'}
                                            </span>
                                            <Badge className="text-[9px] uppercase tracking-wide bg-rose-500 text-white font-bold py-0.5" variant="outline">
                                                {violation.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                            {violation.details}
                                        </p>
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                                            <span>{violation.type.replace('_', ' ').toUpperCase()}</span>
                                            <span>{new Date(violation.detected_at || violation.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                                    <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
                                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Clean Sheet</h4>
                                    <p className="text-[10px] text-zinc-500 max-w-[200px] mt-0.5">No anti-cheat rules have been breached today.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' }
    ]
};
