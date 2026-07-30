import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeviceConfigPanel } from '@/components/DeviceConfigPanel';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface AndroidConfigData {
    base_url: string;
    api_url: string;
    exam_url: string;
    min_version: string;
    latest_version: string;
    force_update: boolean;
    maintenance_mode: boolean;
    lock_mode: boolean;
    heartbeat_interval_seconds: number;
    cache_policy: string;
    broadcast_message: string;
}

interface AndroidConfigPageProps {
    config: AndroidConfigData;
    policy: any;
}

export default function AndroidConfigPage({ config, policy }: AndroidConfigPageProps) {
    const [baseUrl, setBaseUrl] = useState(config.base_url);
    const [apiUrl, setApiUrl] = useState(config.api_url);
    const [examUrl, setExamUrl] = useState(config.exam_url);
    const [minVersion, setMinVersion] = useState(config.min_version);
    const [latestVersion, setLatestVersion] = useState(config.latest_version);
    const [forceUpdate, setForceUpdate] = useState(config.force_update);
    const [maintenanceMode, setMaintenanceMode] = useState(config.maintenance_mode);
    const [lockMode, setLockMode] = useState(config.lock_mode);
    const [heartbeatInterval, setHeartbeatInterval] = useState(config.heartbeat_interval_seconds);
    const [cachePolicy, setCachePolicy] = useState(config.cache_policy);
    const [broadcastMessage, setBroadcastMessage] = useState(config.broadcast_message || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveConfig = () => {
        setIsSaving(true);
        router.post('/api/web/config/update', {
            base_url: baseUrl,
            api_url: apiUrl,
            exam_url: examUrl,
            min_version: minVersion,
            latest_version: latestVersion,
            force_update: forceUpdate,
            maintenance_mode: maintenanceMode,
            lock_mode: lockMode,
            heartbeat_interval_seconds: heartbeatInterval,
            cache_policy: cachePolicy,
            broadcast_message: broadcastMessage,
        }, {
            onSuccess: () => {
                toast.success('Android settings saved.');
                setIsSaving(false);
            },
            onError: () => {
                toast.error('Failed to save settings.');
                setIsSaving(false);
            }
        });
    };

    return (
        <>
            <Head title="Android System Configuration" />

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Android System Configuration</h1>
                    <p className="text-sm text-zinc-500">Configure global parameters and security thresholds parsed automatically by the Student App clients.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Main settings */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <Settings className="h-5 w-5 text-indigo-500" />
                                    <CardTitle className="text-base font-bold">App Environment & URLs</CardTitle>
                                </div>
                                <CardDescription>Point the client WebView and endpoints to your CBT domain gateways.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="base-url">Base Domain URL</Label>
                                        <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="api-url">REST API Endpoint</Label>
                                        <Input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exam-url">CBT Landing URL</Label>
                                    <Input id="exam-url" value={examUrl} onChange={(e) => setExamUrl(e.target.value)} />
                                    <p className="text-[10px] text-zinc-500">The landing screen WebView redirects candidate to on entry.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="min-ver">Minimum App Version</Label>
                                        <Input id="min-ver" value={minVersion} onChange={(e) => setMinVersion(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="latest-ver">Latest Version</Label>
                                        <Input id="latest-ver" value={latestVersion} onChange={(e) => setLatestVersion(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="hb-int">Heartbeat (Seconds)</Label>
                                        <Input id="hb-int" type="number" value={heartbeatInterval} onChange={(e) => setHeartbeatInterval(parseInt(e.target.value) || 5)} />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label htmlFor="broadcast">System-wide Banner Message</Label>
                                    <Input id="broadcast" placeholder="Ex: Ujian matematika akan dimulai dalam 10 menit..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
                                <Button onClick={handleSaveConfig} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save App Settings
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Security rules editor panel */}
                        <DeviceConfigPanel policy={policy} />
                    </div>

                    {/* Right Column: Status toggles and rules description */}
                    <div className="space-y-6">
                        <Card className="border border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-base font-bold">Emergency Overrides</CardTitle>
                                <CardDescription>Real-time killswitches sent directly to active devices.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Lock Mode</Label>
                                        <span className="block text-[10px] text-zinc-500">Lock all running instances.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLockMode(!lockMode)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            lockMode ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                lockMode ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Maintenance Mode</Label>
                                        <span className="block text-[10px] text-zinc-500">Disable candidate entry.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            maintenanceMode ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Force Update</Label>
                                        <span className="block text-[10px] text-zinc-500">Enforce minimum version blocks.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForceUpdate(!forceUpdate)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            forceUpdate ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                forceUpdate ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-300">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">System Compliance Warnings</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-2 leading-relaxed">
                                <p><strong>1. LOCK MODE ACTIVE:</strong> Turning this ON locks every device currently executing the exam. Devices will display a red block screen immediately.</p>
                                <p><strong>2. FORCE UPDATE:</strong> Enabling this will boot students out if their app build version is lower than the configured minimum version.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

AndroidConfigPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Android Configuration', href: '/dashboard/config' }
    ]
};
