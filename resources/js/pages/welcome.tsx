import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { index as sandbox } from '@/routes/sandbox';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="PoofMQ — Dumb Simple Message Queue">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex min-h-screen flex-col bg-black font-mono text-white uppercase selection:bg-[#FFBF00] selection:text-black">
                {/* Header */}
                <header className="flex flex-col items-start justify-between gap-6 border-b-4 border-white bg-[#000033]/20 px-6 py-6 md:flex-row md:items-center lg:px-12">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-5xl text-[#FFBF00]">
                            cyclone
                        </span>
                        <h2 className="text-4xl font-black italic">POOF_MQ</h2>
                    </div>
                    <nav className="flex flex-wrap gap-x-8 gap-y-2 text-xl font-bold">
                        <a
                            className="px-2 transition-colors hover:bg-[#FFBF00] hover:text-black"
                            href="#features"
                        >
                            FEATURES
                        </a>
                        <a
                            className="px-2 transition-colors hover:bg-[#FFBF00] hover:text-black"
                            href="#pricing"
                        >
                            PRICING
                        </a>
                        <a
                            className="px-2 transition-colors hover:bg-[#FFBF00] hover:text-black"
                            href="/docs/quickstart"
                        >
                            DOCS
                        </a>
                        <a
                            className="px-2 transition-colors hover:bg-[#FFBF00] hover:text-black"
                            href="#vault"
                        >
                            VAULT
                        </a>
                    </nav>
                    <div className="flex gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="border-2 border-[#FFBF00] bg-[#FFBF00] px-6 py-2 font-bold text-black transition-all hover:bg-transparent hover:text-[#FFBF00]"
                            >
                                DASHBOARD
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="border-2 border-white px-6 py-2 font-bold hover:bg-white hover:text-black"
                                >
                                    SIGN_IN
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="border-2 border-[#FFBF00] bg-[#FFBF00] px-6 py-2 font-bold text-black transition-all hover:bg-transparent hover:text-[#FFBF00]"
                                    >
                                        EXEC_START
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="border-b-4 border-white bg-[#0a0a0a] p-6 lg:p-12">
                        <div className="mb-8">
                            <div className="mb-4 inline-block bg-[#FFBF00] px-4 py-1 font-bold text-black">
                                SYSTEM_STATUS: V1.4_STABLE
                            </div>
                            <h1 className="text-6xl leading-none font-black tracking-tighter md:text-7xl lg:text-8xl">
                                SIMPLE,
                                <br />
                                <span className="text-[#FFBF00]">FREE</span>
                                <br />
                                MESSAGE QUEUE
                            </h1>
                        </div>

                        {/* Terminal Code Block */}
                        <div className="mb-8 max-w-xl overflow-x-auto rounded-sm border border-white/20 bg-black/50 p-4 font-mono text-sm">
                            <p className="text-white/50"># PUSH_MSG_CMD</p>
                            <p className="text-white">
                                curl -X POST https://poofmq.com/api/v1/q/
                                <span className="text-[#FFBF00]">
                                    {'{queue_id}'}
                                </span>
                                /messages
                            </p>
                            <p className="mt-2 text-white/50"># POP_MSG_CMD</p>
                            <p className="text-white">
                                curl https://poofmq.com/api/v1/q/
                                <span className="text-[#FFBF00]">
                                    {'{queue_id}'}
                                </span>
                                /messages
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="border-4 border-[#FFBF00] bg-[#FFBF00] px-10 py-6 text-2xl font-black text-black transition-transform hover:translate-x-1 hover:-translate-y-1"
                                >
                                    GO_TO_DASHBOARD
                                </Link>
                            ) : (
                                <Link
                                    href={canRegister ? register() : login()}
                                    className="border-4 border-[#FFBF00] bg-[#FFBF00] px-10 py-6 text-2xl font-black text-black transition-transform hover:translate-x-1 hover:-translate-y-1"
                                >
                                    GET_STARTED_FREE
                                </Link>
                            )}
                            <Link
                                href={sandbox()}
                                className="border-4 border-white bg-white px-10 py-6 text-2xl font-black text-black transition-transform hover:translate-x-1 hover:-translate-y-1"
                            >
                                TRY_SANDBOX.SH
                            </Link>
                        </div>

                        <p className="max-w-3xl text-xl leading-none text-white/60">
                            A 100% FREE SERVICE FOR EVERYONE. PUSH AND POP
                            MESSAGES WITH A SIMPLE CURL COMMAND. NO AUTH
                            REQUIRED FOR SANDBOXES.{' '}
                            <span className="text-[#FFBF00]">
                                ZERO-KNOWLEDGE ENCRYPTION
                            </span>{' '}
                            FOR REGISTERED USERS.
                        </p>
                    </section>

                    {/* Features Section */}
                    <section
                        id="features"
                        className="grid bg-[#000033]/10 md:grid-cols-2"
                    >
                        <div className="group border-r-4 border-b-4 border-white p-8 transition-colors hover:bg-[#FFBF00] hover:text-black">
                            <span className="material-symbols-outlined mb-6 block text-6xl text-[#FFBF00] group-hover:text-black">
                                bolt
                            </span>
                            <h3 className="mb-4 text-2xl font-black">
                                ZERO-FRICTION SANDBOX
                            </h3>
                            <p className="text-sm leading-tight font-bold opacity-80">
                                ANONYMOUS UUID QUEUES FOR INSTANT PROTOTYPING.
                                NO SIGNUPS, NO KEYS, JUST CODE. NO GUARANTEES
                                FOR UNREGISTERED USE.
                            </p>
                        </div>
                        <div className="group border-b-4 border-white p-8 transition-colors hover:bg-[#FFBF00] hover:text-black md:border-r-4">
                            <span className="material-symbols-outlined mb-6 block text-6xl text-[#FFBF00] group-hover:text-black">
                                lock
                            </span>
                            <h3 className="mb-4 text-2xl font-black">
                                CLIENT-SIDE ENCRYPTION
                            </h3>
                            <p className="text-sm leading-tight font-bold opacity-80">
                                ZERO-KNOWLEDGE ARCHITECTURE FOR REGISTERED
                                USERS. WE CAN'T READ YOUR DATA, EVEN IF WE
                                WANTED TO. FULL DELIVERY GUARANTEES.
                            </p>
                        </div>
                        <div className="group border-b-4 border-white p-8 transition-colors hover:bg-[#FFBF00] hover:text-black md:border-r-4 md:border-b-0">
                            <span className="material-symbols-outlined mb-6 block text-6xl text-[#FFBF00] group-hover:text-black">
                                favorite
                            </span>
                            <h3 className="mb-4 text-2xl font-black">
                                100% COMMUNITY FUNDED
                            </h3>
                            <p className="text-sm leading-tight font-bold opacity-80">
                                NO VC STRINGS ATTACHED. SUBSIDIZED BY THE
                                COMMUNITY VIA THE RUNWAY VAULT TO KEEP THE
                                SERVERS SPINNING FOR ALL.
                            </p>
                        </div>
                        <div className="group border-white p-8 transition-colors hover:bg-[#FFBF00] hover:text-black">
                            <span className="material-symbols-outlined mb-6 block text-6xl text-[#FFBF00] group-hover:text-black">
                                code
                            </span>
                            <h3 className="mb-4 text-2xl font-black">
                                SDKS & APIS
                            </h3>
                            <p className="text-sm leading-tight font-bold opacity-80">
                                OFFICIAL SDKS FOR NODE.JS, PYTHON, AND GO. FULL
                                OPENAPI SPEC. GET STARTED IN UNDER 5 MINUTES.
                            </p>
                        </div>
                    </section>

                    {/* Runway Vault Section */}
                    <section
                        id="vault"
                        className="border-b-4 border-white bg-[#000033]/20 px-6 py-24"
                    >
                        <div className="mx-auto max-w-4xl">
                            <div className="mb-12 flex flex-col items-start gap-4">
                                <div className="bg-white px-4 py-1 text-2xl font-black text-black">
                                    RUNWAY_VAULT_STATUS
                                </div>
                                <p className="max-w-2xl text-xl opacity-70">
                                    THE RUNWAY VAULT COVERS OUR MONTHLY
                                    INFRASTRUCTURE COSTS TO KEEP THE SANDBOX
                                    FREE FOR EVERYONE.
                                </p>
                            </div>
                            <div className="border-4 border-white bg-black p-10">
                                <div className="mb-8 flex items-end justify-between">
                                    <div>
                                        <p className="mb-1 text-sm font-bold opacity-50">
                                            CURRENT_REVENUE_STREAM
                                        </p>
                                        <p className="text-5xl font-black text-[#FFBF00]">
                                            $420 / $500
                                        </p>
                                    </div>
                                    <p className="text-7xl font-black italic">
                                        84%
                                    </p>
                                </div>
                                <div className="mb-10 h-16 w-full border-4 border-white bg-[#000033]/40 p-2">
                                    <div
                                        className="h-full bg-[#FFBF00]"
                                        style={{ width: '84%' }}
                                    ></div>
                                </div>
                                <div className="mb-10 bg-white p-6 text-lg font-bold text-black">
                                    [!] CURRENT RAILWAY API BILLING AND REDIS
                                    CLUSTER OVERHEAD COVERED BY COMMUNITY TIPS.
                                </div>
                                <button className="w-full border-4 border-[#FFBF00] py-8 font-black text-[#FFBF00] transition-all hover:bg-[#FFBF00] hover:text-black">
                                    DROP_TIP_IN_THE_VAULT.EXE
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Section */}
                    <section
                        id="pricing"
                        className="mx-auto max-w-6xl px-6 py-24"
                    >
                        <h2 className="mb-16 text-center text-4xl font-black underline decoration-[#FFBF00] decoration-4 underline-offset-8 md:text-5xl">
                            PRICING
                        </h2>
                        <p className="mb-12 text-center text-xl text-[#FFBF00]">
                            [!] ALL TIERS ARE SUBSIDIZED BY THE COMMUNITY TIP
                            JAR. ZERO VC FUNDING.
                        </p>

                        <div className="grid md:grid-cols-3">
                            {/* Anonymous Tier */}
                            <div className="flex flex-col border-4 border-white p-10">
                                <h3 className="mb-4 text-3xl font-black">
                                    ANONYMOUS
                                </h3>
                                <div className="mb-8 text-6xl font-black">
                                    $0
                                    <span className="text-xl opacity-70">
                                        /FREE
                                    </span>
                                </div>
                                <ul className="mb-12 flex-1 space-y-6 text-lg font-bold">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black text-[#FFBF00]">
                                            check_circle
                                        </span>
                                        UUID SANDBOX QUEUES
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black text-[#FFBF00]">
                                            check_circle
                                        </span>
                                        10,000 REQ/MONTH
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black text-[#FFBF00]">
                                            check_circle
                                        </span>
                                        10MIN MESSAGE TTL
                                    </li>
                                </ul>
                                <Link
                                    href={sandbox()}
                                    className="w-full border-4 border-white py-4 text-xl font-black hover:bg-white hover:text-black"
                                >
                                    START_ANON
                                </Link>
                            </div>

                            {/* Registered Tier */}
                            <div className="flex flex-col border-4 border-white bg-[#FFBF00] p-10 text-black md:border-r-4 md:border-b-0">
                                <div className="inline-start mb-4 self-start bg-black px-4 py-1 text-xs font-black text-white">
                                    FULLY_SUBSIDIZED
                                </div>
                                <h3 className="mb-4 text-3xl font-black">
                                    REGISTERED
                                </h3>
                                <div className="mb-8 text-6xl font-black">
                                    $0
                                    <span className="text-xl opacity-70">
                                        /FREE
                                    </span>
                                </div>
                                <ul className="mb-12 flex-1 space-y-6 text-lg font-bold">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black">
                                            check_circle
                                        </span>
                                        PROJECT MANAGEMENT
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black">
                                            check_circle
                                        </span>
                                        SCOPED API KEYS
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black">
                                            check_circle
                                        </span>
                                        ZERO-KNOWLEDGE ENCRYPTION
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black">
                                            check_circle
                                        </span>
                                        1,000,000 REQ
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined font-black">
                                            check_circle
                                        </span>
                                        24H TTL
                                    </li>
                                </ul>
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="w-full border-4 border-black bg-black py-4 text-xl font-black text-white hover:bg-transparent hover:text-black"
                                    >
                                        GO_DASHBOARD
                                    </Link>
                                ) : (
                                    <Link
                                        href={
                                            canRegister ? register() : login()
                                        }
                                        className="w-full border-4 border-black bg-black py-4 text-xl font-black text-white hover:bg-transparent hover:text-black"
                                    >
                                        SIGN_UP_NOW
                                    </Link>
                                )}
                            </div>

                            {/* Tip Jar Tier */}
                            <div className="flex flex-col border-4 border-white bg-[#000033]/5 p-10">
                                <h3 className="mb-4 text-3xl font-black">
                                    TIP_JAR
                                </h3>
                                <div className="mb-4 text-6xl font-black">
                                    CUSTOM
                                </div>
                                <p className="mb-8 text-sm italic opacity-60">
                                    "HELP KEEP THE LIGHTS ON FOR THE COMMUNITY."
                                </p>
                                <ul className="mb-12 flex-1 space-y-6 text-lg">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#FFBF00]">
                                            volunteer_activism
                                        </span>
                                        SUPPORT OSS DEVS
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#FFBF00]">
                                            star
                                        </span>
                                        DONOR BADGE
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#FFBF00]">
                                            priority_high
                                        </span>
                                        PRIORITY SUPPORT
                                    </li>
                                </ul>
                                <button className="w-full border-4 border-white py-4 text-xl font-black hover:bg-white hover:text-black">
                                    CONTRIBUTE.SH
                                </button>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t-4 border-white bg-[#000033]/30 p-6 lg:p-12">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-4xl font-bold text-[#FFBF00]">
                                cyclone
                            </span>
                            <span className="text-2xl font-black">
                                POOF_MQ_V1.4
                            </span>
                        </div>
                        <p className="text-sm leading-none font-bold opacity-60">
                            © 2024 POOFMQ. BUILT WITH GOLANG & PRIDE. ZERO
                            TRACKING. TERMINATE_SESSION.
                        </p>
                        <div className="flex gap-8">
                            <a
                                className="hover:text-[#FFBF00]"
                                href="https://github.com/poofmq"
                            >
                                <span className="material-symbols-outlined text-3xl">
                                    terminal
                                </span>
                            </a>
                            <a className="hover:text-[#FFBF00]" href="#">
                                <span className="material-symbols-outlined text-3xl">
                                    rss_feed
                                </span>
                            </a>
                            <a className="hover:text-[#FFBF00]" href="#">
                                <span className="material-symbols-outlined text-3xl">
                                    alternate_email
                                </span>
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
