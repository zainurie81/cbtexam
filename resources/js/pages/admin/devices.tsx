import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, Cpu, Smartphone, Lock, Unlock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DeviceData {
    id: number;
    device_id: string;
    brand: string;
    model: string;
    os_version: string;
    ram_mb: number;
    storage_mb: number;
    ip_address: string;
    mac_address: string;
    app_version: string;
    is_rooted: boolean;
    is_developer_mode: boolean;
    is_usb_debugging: boolean;
    is_emulator: boolean;
    is_locked: boolean;
    exam_sessions: Array<{
        id: number;
        status: string;
        user: {
            name: string;
        };
    }>;
}

interface DevicesPageProps {
    devices: DeviceData[];
}

export default function DevicesPage({ devices }: DevicesPageProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDevices = devices.filter(d => 
        (d.brand && d.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.model && d.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggleLock = (deviceId: number) => {
        router.post(`/api/web/devices/${deviceId}/toggle-lock`, {}, {
            onSuccess: () => {
                toast.success('Device lock state toggled.');
            }
        });
    };

    return (
        <>
            <Head title="Devices Registry" />

            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Devices Registry</h1>
                    <p className="text-sm text-zinc-500">Inspect registered Android devices hardware specifications and lockout constraints.</p>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <div className="relative w-full sm:w-[320px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Search by brand, model or device ID..." 
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Registered Devices ({filteredDevices.length})</CardTitle>
                        <CardDescription>All device details logged from Student App clients during enrollment or login.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left border-t border-zinc-100 dark:border-zinc-900">
                            <thead className="bg-zinc-50 dark:bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 dark:border-zinc-900">
                                <tr>
                                    <th className="px-6 py-4">Brand / Model</th>
                                    <th className="px-6 py-4">Specs & OS</th>
                                    <th className="px-6 py-4">Security Audits</th>
                                    <th className="px-6 py-4">Active User</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                {filteredDevices.length > 0 ? (
                                    filteredDevices.map(device => {
                                        const activeSession = device.exam_sessions.find(s => s.status === 'active');
                                        return (
                                            <tr key={device.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/25">
                                                <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                                                    <div className="flex items-center gap-2">
                                                        <Smartphone className="h-4 w-4 text-zinc-500" />
                                                        <div>
                                                            <span>{device.brand || 'Unknown'} {device.model || 'Device'}</span>
                                                            <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">{device.device_id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <Cpu className="h-3 w-3 text-zinc-400" />
                                                            {device.ram_mb ? `${Math.round(device.ram_mb / 1024)}GB` : 'N/A'} RAM / {device.storage_mb ? `${Math.round(device.storage_mb / 1024)}GB` : 'N/A'} Disk
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1 text-zinc-500 border-zinc-200">
                                                            {device.os_version || 'Android N/A'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-[9px] py-0 px-1.5 ${device.is_rooted ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                                                        >
                                                            {device.is_rooted ? 'ROOTED' : 'UNROOTED'}
                                                        </Badge>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-[9px] py-0 px-1.5 ${device.is_developer_mode ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                                                        >
                                                            {device.is_developer_mode ? 'DEV MODE' : 'DEV SAFE'}
                                                        </Badge>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-[9px] py-0 px-1.5 ${device.is_emulator ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                                                        >
                                                            {device.is_emulator ? 'EMULATOR' : 'PHYSICAL'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                    {activeSession ? (
                                                        <div className="space-y-0.5">
                                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{activeSession.user.name}</span>
                                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Exam Session Active</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-400">No active session</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {device.is_locked ? (
                                                        <Badge variant="destructive" className="bg-rose-600 text-white font-bold animate-pulse border-0 text-[10px]">
                                                            LOCKED
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px]">
                                                            UNLOCKED
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        variant={device.is_locked ? 'default' : 'outline'} 
                                                        size="sm"
                                                        onClick={() => handleToggleLock(device.id)}
                                                        className={device.is_locked ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                                                    >
                                                        {device.is_locked ? (
                                                            <>
                                                                <Unlock className="h-3.5 w-3.5 mr-1" />
                                                                Unlock
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Lock className="h-3.5 w-3.5 mr-1" />
                                                                Lock
                                                            </>
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-zinc-400 font-medium">
                                            No registered devices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

DevicesPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Devices Registry', href: '/dashboard/devices' }
    ]
};
