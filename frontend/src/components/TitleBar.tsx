import { StatusIndicator } from './StatusIndicator';

type Status = 'checking' | 'needsInstall' | 'needsHomebrew' | 'connecting' | 'connected' | 'error';

interface TitleBarProps {
    status: Status;
}

export function TitleBar({ status }: TitleBarProps) {
    return (
        <div
            className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 h-11 border-b border-white/5 bg-bg/80 backdrop-blur-md"
            style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
        >
            {/* macOS traffic lights spacing */}
            <div className="w-16" />

            {/* Title */}
            <span className="text-xs font-medium tracking-wide text-white/40 uppercase">QuadCast RGB</span>

            {/* Status */}
            <div className="w-16 flex justify-end">
                <StatusIndicator status={status} />
            </div>
        </div>
    );
}
