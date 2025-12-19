type Status = 'checking' | 'needsInstall' | 'needsHomebrew' | 'connecting' | 'connected' | 'error';

interface StatusIndicatorProps {
    status: Status;
}

const statusConfig: Record<Status, { color: string; label: string; pulse?: boolean }> = {
    checking: { color: 'bg-blue-500', label: 'Checking...', pulse: true },
    connecting: { color: 'bg-blue-500', label: 'Connecting...', pulse: true },
    connected: { color: 'bg-emerald-500', label: 'Connected' },
    error: { color: 'bg-red-500', label: 'Error' },
    needsInstall: { color: 'bg-amber-500', label: 'Setup Required' },
    needsHomebrew: { color: 'bg-amber-500', label: 'Setup Required' },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
    const config = statusConfig[status];

    return (
        <div className="flex items-center justify-end gap-2 min-w-40">
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
                {config.pulse && <div className={`absolute w-full h-full rounded-full ${config.color} animate-ping opacity-75`} />}
                <div className={`relative w-2 h-2 rounded-full ${config.color}`} />
            </div>
            <span className="text-xs font-medium text-white/50">{config.label}</span>
        </div>
    );
}
