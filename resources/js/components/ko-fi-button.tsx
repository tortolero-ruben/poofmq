import { Coffee } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type KoFiButtonProps = {
    href: string | null;
    className?: string;
    label?: string;
    size?: 'default' | 'sm' | 'lg' | 'icon';
};

export default function KoFiButton({
    href,
    className,
    label = 'Support me on Ko-fi',
    size = 'default',
}: KoFiButtonProps) {
    if (!href) {
        return null;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                buttonVariants({
                    variant: 'ghost',
                    size,
                }),
                'bg-[#72a4f2] text-slate-950 shadow-sm hover:bg-[#72a4f2]/90 hover:text-slate-950 hover:shadow-[0_0_24px_rgba(114,164,242,0.35)] focus-visible:ring-[#72a4f2]',
                className,
            )}
        >
            <Coffee className="size-4" />
            {label}
        </a>
    );
}
