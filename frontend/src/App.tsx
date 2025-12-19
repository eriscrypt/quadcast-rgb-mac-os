import { useState, useEffect, useRef } from 'react';
import {
    Connect,
    SetColor,
    Off,
    CheckDependencies,
    InstallDependencies,
    GetUSBDevices,
    LoadSettings,
    SaveColorSetting,
} from '../wailsjs/go/main/App';
import { TitleBar, ColorWheel, ColorPresets, Button, DebugModal } from './components';

type AppState = 'checking' | 'needsInstall' | 'needsHomebrew' | 'connecting' | 'connected' | 'error';

interface DependencyResult {
    installed: boolean;
    message: string;
}

export default function App() {
    const [state, setState] = useState<AppState>('checking');
    const [color, setColor] = useState('#ff0000');
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [isLedOff, setIsLedOff] = useState(false);

    const lastSavedColorRef = useRef<string | null>(null);

    useEffect(() => {
        checkDependencies();
    }, []);

    async function checkDependencies() {
        try {
            const result = (await CheckDependencies()) as DependencyResult;

            if (result.installed) {
                await connect();
            } else {
                if (result.message.includes('Homebrew')) {
                    setState('needsHomebrew');
                } else {
                    setState('needsInstall');
                }
            }
        } catch {
            setState('error');
        }
    }

    async function installDeps() {
        try {
            setState('checking');
            await InstallDependencies();
            await checkDependencies();
        } catch {
            setState('error');
        }
    }

    async function connect() {
        try {
            setState('connecting');
            await Connect();
            setState('connected');
            await loadSavedColor();
        } catch (err) {
            const errorMsg = String(err);
            setState('error');

            if (errorMsg.includes('not found')) {
                setShowDebug(true);
            }
        }
    }

    async function loadSavedColor() {
        try {
            const settings = (await LoadSettings()) as { lastColor?: string };
            if (settings?.lastColor) {
                const hex = '#' + settings.lastColor;
                setColor(hex);
                await applyColor(hex, false);
            }
        } catch (err) {
            console.error('Error loading saved color:', err);
        }
    }

    async function applyColor(hex: string, save = true) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        // Immediately update UI state
        setIsLedOff(false);

        // Save first, then apply to device
        if (save) {
            const colorToSave = hex.slice(1);
            if (lastSavedColorRef.current !== colorToSave) {
                lastSavedColorRef.current = colorToSave;
                try {
                    await SaveColorSetting(colorToSave);
                } catch (err) {
                    console.error('Error saving color:', err);
                }
            }
        }

        try {
            await SetColor(r, g, b);
        } catch (err) {
            console.error('Error setting color:', err);
        }
    }

    function handleColorChange(hex: string) {
        setColor(hex);
        applyColor(hex);
    }

    async function turnOff() {
        try {
            await Off();
            setIsLedOff(true);
        } catch (err) {
            console.error('Error:', err);
        }
    }

    async function handleShowDebug() {
        try {
            const devices = await GetUSBDevices();
            setDebugInfo(devices);
        } catch (err) {
            setDebugInfo('Error: ' + String(err));
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <TitleBar status={state} />

            {/* Main content */}
            <div className="flex flex-col items-center justify-center flex-1 px-6 pt-14">
                {/* Setup screens */}
                {(state === 'needsInstall' || state === 'needsHomebrew') && (
                    <div className="w-full max-w-sm space-y-6 text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-amber-500/20">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="mb-2 text-lg font-semibold text-white">Setup Required</h2>
                            <p className="text-sm text-white/50">
                                {state === 'needsHomebrew'
                                    ? 'Please install dependencies manually, then click below.'
                                    : 'Click below to automatically install required dependencies.'}
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={state === 'needsHomebrew' ? () => window.location.reload() : installDeps}
                        >
                            {state === 'needsHomebrew' ? "I've Installed Dependencies" : 'Install Dependencies'}
                        </Button>
                    </div>
                )}

                {/* Error screen */}
                {state === 'error' && (
                    <div className="w-full max-w-sm space-y-6 text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-red-500/20">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="mb-2 text-lg font-semibold text-white">Device Not Found</h2>
                            <p className="text-sm text-white/50">Make sure your HyperX QuadCast is connected and powered on.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                            {showDebug && (
                                <Button variant="ghost" onClick={handleShowDebug}>
                                    Debug
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading screen */}
                {(state === 'checking' || state === 'connecting') && (
                    <div className="space-y-4 text-center">
                        <div className="w-12 h-12 mx-auto border-2 rounded-full border-white/10 border-t-accent animate-spin" />
                        <p className="text-sm text-white/50">
                            {state === 'checking' ? 'Checking dependencies...' : 'Connecting to device...'}
                        </p>
                    </div>
                )}

                {/* Connected - Color controls */}
                {state === 'connected' && (
                    <div className="w-full max-w-sm space-y-8">
                        {/* Color wheel */}
                        <div className="flex justify-center">
                            <ColorWheel value={color} onChange={handleColorChange} size={200} disabled={isLedOff} />
                        </div>

                        {/* Presets */}
                        <div className={`mt-10 space-y-2 transition-all duration-300 ${isLedOff ? 'opacity-30' : ''}`}>
                            <p className="text-xs font-medium tracking-wide text-center uppercase text-white/40">Quick Colors</p>
                            <ColorPresets activeColor={color} onSelect={handleColorChange} disabled={isLedOff} />
                        </div>

                        {/* Power button */}
                        <Button
                            variant={isLedOff ? 'ghost' : 'danger'}
                            size="md"
                            className="w-full"
                            onClick={isLedOff ? () => applyColor(color) : turnOff}
                        >
                            {isLedOff ? 'Turn On LED' : 'Turn Off LED'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Debug modal */}
            {debugInfo && <DebugModal info={debugInfo} onClose={() => setDebugInfo('')} />}
        </div>
    );
}
