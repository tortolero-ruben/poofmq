import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            donationUrl: string | null;
            sidebarOpen: boolean;
            turnstile: {
                siteKey: string | null;
            };
            [key: string]: unknown;
        };
    }
}
