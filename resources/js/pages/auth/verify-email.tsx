// Components
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 border-4 border-[#FFBF00] bg-[#FFBF00]/10 p-4 text-center text-sm font-bold text-[#FFBF00] uppercase">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            className="h-12 px-8 text-base font-black uppercase"
                        >
                            {processing && <Spinner />}
                            Resend Verification Email
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm font-bold text-[#FFBF00] uppercase"
                        >
                            Sign Out
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
