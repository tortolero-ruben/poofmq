<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.98 0 0);
            }

            html.dark {
                background-color: oklch(0.10 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=geist:400,500,600,700" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia

        <script>
            (function () {
                if (window.__poofmqKoFiOverlayLoaded) {
                    return;
                }

                window.__poofmqKoFiOverlayLoaded = true;

                const script = document.createElement('script');
                script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
                script.async = true;
                script.onload = function () {
                    if (window.kofiWidgetOverlay?.draw) {
                        window.kofiWidgetOverlay.draw('poofmq', {
                            type: 'floating-chat',
                            'floating-chat.donateButton.text': 'Donate',
                            'floating-chat.donateButton.background-color': '#fcbf47',
                            'floating-chat.donateButton.text-color': '#323842',
                        });
                    }
                };

                document.body.appendChild(script);
            })();
        </script>
    </body>
</html>
