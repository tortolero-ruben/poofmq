import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'font-bold text-[#FFBF00] uppercase underline-offset-4 transition-colors hover:text-white hover:underline',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
