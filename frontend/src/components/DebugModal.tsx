interface DebugModalProps {
    info: string;
    onClose: () => void;
}

export function DebugModal({ info, onClose }: DebugModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-bg border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">USB Devices (Debug)</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <textarea
                    readOnly
                    value={info}
                    className="w-full h-64 p-4 font-mono text-xs text-white/70 bg-black/50 border border-white/10 rounded-xl resize-none focus:outline-none"
                />

                <p className="mt-3 text-xs text-white/40">Copy this information and send it to the developer if you need help.</p>
            </div>
        </div>
    );
}
