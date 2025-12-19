import { useRef, useEffect, useCallback, useState } from 'react';

interface ColorWheelProps {
    value: string;
    onChange: (color: string) => void;
    size?: number;
    disabled?: boolean;
}

export function ColorWheel({ value, onChange, size = 180, disabled }: ColorWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const onChangeRef = useRef(onChange);
    // Local color state for instant visual feedback
    const [displayColor, setDisplayColor] = useState(value);

    // Keep onChange ref up to date
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Sync with external value when not dragging
    useEffect(() => {
        if (!isDragging.current) {
            setDisplayColor(value);
        }
    }, [value]);

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 8;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = ((angle - 1) * Math.PI) / 180;
            const endAngle = ((angle + 1) * Math.PI) / 180;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${angle}, 100%, 30%)`);

            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw center glow
        const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.3);
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }, [size]);

    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    const getColorAtPosition = useCallback(
        (x: number, y: number): string | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;

            const rect = canvas.getBoundingClientRect();
            const canvasX = ((x - rect.left) / rect.width) * size;
            const canvasY = ((y - rect.top) / rect.height) * size;

            // Check if position is within canvas bounds
            if (canvasX < 0 || canvasX >= size || canvasY < 0 || canvasY >= size) {
                return null;
            }

            // Check if position is within the circle
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 8;
            const distance = Math.sqrt((canvasX - centerX) ** 2 + (canvasY - centerY) ** 2);

            if (distance > radius) {
                return null;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const imageData = ctx.getImageData(canvasX, canvasY, 1, 1).data;

            // Skip transparent or black pixels (outside the wheel)
            if (imageData[3] === 0 || (imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0)) {
                return null;
            }

            return `#${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;
        },
        [size]
    );

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;

        const point = 'touches' in e ? e.touches[0] : e;
        const color = getColorAtPosition(point.clientX, point.clientY);

        // Only update if we got a valid color (inside the wheel)
        if (color) {
            setDisplayColor(color);
            onChange(color);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;

        isDragging.current = true;
        handleInteraction(e);

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Listen on window for drag
        const handleWindowMouseMove = (ev: MouseEvent) => {
            if (!isDragging.current || !canvas) return;

            const rect = canvas.getBoundingClientRect();
            const canvasX = ((ev.clientX - rect.left) / rect.width) * size;
            const canvasY = ((ev.clientY - rect.top) / rect.height) * size;

            // Check bounds
            if (canvasX < 0 || canvasX >= size || canvasY < 0 || canvasY >= size) return;

            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 8;
            const distance = Math.sqrt((canvasX - centerX) ** 2 + (canvasY - centerY) ** 2);

            if (distance > radius) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const imageData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
            if (imageData[3] === 0 || (imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0)) return;

            const color = `#${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;
            setDisplayColor(color);
            onChangeRef.current(color);
        };

        const handleWindowMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        handleInteraction(e);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging.current) {
            handleInteraction(e);
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };

    return (
        <div
            className={`relative flex items-center justify-center transition-all duration-300 ${disabled ? 'opacity-30 grayscale pointer-events-none' : ''}`}
            style={{
                // @ts-expect-error Wails custom CSS property
                '--wails-draggable': 'no-drag',
            }}
        >
            {/* Outer pulsing ring */}
            <div
                className="absolute rounded-full animate-pulse"
                style={{
                    width: size + 56,
                    height: size + 56,
                    background: `conic-gradient(from 0deg, ${displayColor}40, transparent 50%, ${displayColor}40)`,
                    animationDuration: '2s',
                }}
            />

            {/* Primary spinning ring */}
            <div
                className="absolute rounded-full animate-spin"
                style={{
                    width: size + 48,
                    height: size + 48,
                    background: `conic-gradient(from 0deg, ${displayColor}, transparent 40%, transparent 60%, ${displayColor})`,
                    animationDuration: '3s',
                    opacity: 0.8,
                }}
            />

            {/* Counter-rotating inner ring */}
            <div
                className="absolute rounded-full"
                style={{
                    width: size + 32,
                    height: size + 32,
                    background: `conic-gradient(from 180deg, ${displayColor}90, transparent 30%, transparent 70%, ${displayColor}90)`,
                    animation: 'spin 4s linear infinite reverse',
                    opacity: 0.5,
                }}
            />

            {/* Dark ring to create border effect */}
            <div
                className="absolute rounded-full bg-bg"
                style={{
                    width: size + 12,
                    height: size + 12,
                }}
            />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="relative rounded-full cursor-crosshair"
                style={{
                    boxShadow: `0 0 30px ${displayColor}30`,
                    // @ts-expect-error Wails custom CSS property
                    '--wails-draggable': 'no-drag',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Center color preview with ring */}
            <div
                className="absolute flex items-center justify-center rounded-full w-14 h-14 bg-bg"
                style={{
                    boxShadow: `0 0 20px ${displayColor}50, inset 0 0 15px ${displayColor}20`,
                }}
            >
                <div className="w-10 h-10 border-2 rounded-full border-white/10" style={{ backgroundColor: displayColor }} />
            </div>
        </div>
    );
}
