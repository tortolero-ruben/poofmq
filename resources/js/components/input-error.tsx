import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={cn(
                'text-xs font-bold text-red-400 uppercase',
                className,
            )}
        >
            {message}
        </p>
    ) : null;
}
