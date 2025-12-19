import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const variants = {
    primary: 'bg-accent hover:bg-accent/80 text-white border border-red-500/20',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20',
    ghost: 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white border border-white/10',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
    return (
        <button
            className={`
                ${variants[variant]}
                ${sizes[size]}
                rounded-xl font-medium
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}
