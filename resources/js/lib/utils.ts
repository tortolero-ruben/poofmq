import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function getXsrfToken(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const tokenCookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='));

    if (tokenCookie === undefined) {
        return null;
    }

    return decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
}

export function jsonHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const csrfToken = getXsrfToken();

    if (csrfToken !== null) {
        headers['X-XSRF-TOKEN'] = csrfToken;
    }

    return headers;
}
