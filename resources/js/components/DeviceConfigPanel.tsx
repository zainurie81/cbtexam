import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Shield, Save, RefreshCw } from 'lucide-react';

interface PolicyData {
    id: number;
    name: string;
    violation_weights: Record<string, string>;
    allow_emulator: boolean;
    allow_developer_mode: boolean;
}

interface DeviceConfigPanelProps {
    policy: PolicyData;
}

const violationTypes = [
    { key: 'root_detected', label: 'Root Detection (Magisk, SU)' },
    { key: 'emulator_detected', label: 'Emulator Running' },
    { key: 'app_switch', label: 'App Switching / Home Button' },
    { key: 'screenshot', label: 'Screenshot / Screen Capture' },
    { key: 'usb_debugging', label: 'USB Debugging Active' },
    { key: 'developer_mode', label: 'Developer Options Enabled' },
    { key: 'screen_record', label: 'Screen Recording Detection' },
    { key: 'vpn_proxy', label: 'VPN / Proxy Active' },
];

const severityLevels = [
    { value: 'light', label: 'Light (Alert Only)' },
    { value: 'medium', label: 'Medium (Warning + Alert)' },
    { value: 'heavy', label: 'Heavy (Auto Lock + Alert)' },
    { value: 'critical', label: 'Critical (Auto Submit + Lock)' },
];

export function DeviceConfigPanel({ policy }: DeviceConfigPanelProps) {
    const [weights, setWeights] = useState<Record<string, string>>(policy.violation_weights || {});
    const [allowEmulator, setAllowEmulator] = useState(policy.allow_emulator);
    const [allowDevMode, setAllowDevMode] = useState(policy.allow_developer_mode);
    const [isSaving, setIsSaving] = useState(false);

    const handleSeverityChange = (violationKey: string, severity: string) => {
        setWeights(prev => ({
            ...prev,
            [violationKey]: severity,
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Direct Inertia submit or mock save toast for visual feedback
        router.post(
            `/api/web/policies/${policy.id}/update`,
            {
                violation_weights: weights,
                allow_emulator: allowEmulator,
                allow_developer_mode: allowDevMode,
            },
            {
                onSuccess: () => {
                    toast.success('Security Policy Updated Successfully.');
                    setIsSaving(false);
                },
                onError: () => {
                    toast.error('Failed to update security policy.');
                    setIsSaving(false);
                },
            }
        );
    };

    return (
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    <CardTitle className="text-lg">Security Policy Configuration</CardTitle>
                </div>
                <CardDescription>
                    Configure the severity weights for various anti-cheat violations and hardware allowance policies.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* General Allowance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="flex items-center space-x-3 space-y-0 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                        <Checkbox 
                            id="allow-emulator" 
                            checked={allowEmulator} 
                            onCheckedChange={(checked) => setAllowEmulator(!!checked)} 
                        />
                        <div className="space-y-1">
                            <Label htmlFor="allow-emulator" className="font-semibold text-sm cursor-pointer">
                                Allow Emulator Running
                            </Label>
                            <p className="text-xs text-zinc-500">Allow students to take exam inside Android Virtual Devices.</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 space-y-0 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                        <Checkbox 
                            id="allow-dev-mode" 
                            checked={allowDevMode} 
                            onCheckedChange={(checked) => setAllowDevMode(!!checked)} 
                        />
                        <div className="space-y-1">
                            <Label htmlFor="allow-dev-mode" className="font-semibold text-sm cursor-pointer">
                                Allow Developer Options
                            </Label>
                            <p className="text-xs text-zinc-500">Allow taking exam with Developer Options enabled.</p>
                        </div>
                    </div>
                </div>

                {/* Weights Setup */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Violation Penalty Weights</h3>
                    
                    <div className="space-y-3">
                        {violationTypes.map(violation => (
                            <div key={violation.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 gap-2">
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {violation.label}
                                </span>
                                
                                <div className="flex flex-wrap gap-1">
                                    {severityLevels.map(level => {
                                        const isActive = (weights[violation.key] || 'medium') === level.value;
                                        let activeClass = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
                                        
                                        if (isActive) {
                                            if (level.value === 'light') activeClass = 'bg-emerald-500 text-white font-bold';
                                            if (level.value === 'medium') activeClass = 'bg-amber-500 text-white font-bold';
                                            if (level.value === 'heavy') activeClass = 'bg-orange-500 text-white font-bold';
                                            if (level.value === 'critical') activeClass = 'bg-rose-500 text-white font-bold';
                                        }

                                        return (
                                            <button
                                                key={level.value}
                                                type="button"
                                                onClick={() => handleSeverityChange(violation.key, level.value)}
                                                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded transition-all cursor-pointer ${
                                                    isActive ? activeClass : 'bg-transparent border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                                                }`}
                                            >
                                                {level.label.split(' ')[0]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Security Rules
                </Button>
            </CardFooter>
        </Card>
    );
}
