export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-2'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-1 text-base font-bold tracking-wide uppercase'
                        : 'text-xl font-bold tracking-wide uppercase'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm text-white/60">{description}</p>
            )}
        </header>
    );
}
