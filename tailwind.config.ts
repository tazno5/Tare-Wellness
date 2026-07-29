import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // BE WELL TARE brand palette
                        magenta: {
                                DEFAULT: '#e6007e',
                                50: '#fdf2f9',
                                100: '#fce7f3',
                                200: '#f8bbd0',
                                400: '#f06292',
                                500: '#e6007e',
                                600: '#d4006f',
                                700: '#b3005e',
                                800: '#8f004d',
                                900: '#6b003a',
                        },
                        maroon: {
                                DEFAULT: '#3d002e',
                                soft: 'rgba(61, 0, 46, 0.55)',
                                50: '#fdf0f5',
                                100: '#f9d6e3',
                                400: '#6b144f',
                                500: '#52002e',
                                600: '#3d002e',
                                700: '#2e0023',
                                800: '#1f0018',
                                900: '#0f000c',
                        },
                        blush: {
                                DEFAULT: '#fce4ec',
                                light: '#fff5f9',
                                dark: '#f8bbd0',
                        },
                        // Brand gradient endpoints
                        brand: {
                                from: '#F10897',
                                to: '#AD005A',
                        },
                },
                fontFamily: {
                        sans: ['var(--font-plus-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        jakarta: ['var(--font-plus-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        serif: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
                        fraunces: ['var(--font-fraunces)', 'Georgia', 'Times New Roman', 'serif'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                boxShadow: {
                        'hero': '0 25px 45px rgba(61, 0, 46, 0.35), 0 10px 20px rgba(61, 0, 46, 0.25)',
                        'soft': '0 10px 30px rgba(61, 0, 46, 0.18)',
                        'glass': '0 4px 25px rgba(0, 0, 0, 0.12)',
                },
                keyframes: {
                        'float-slow': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-10px)' },
                        },
                },
                animation: {
                        'float-slow': 'float-slow 6s ease-in-out infinite',
                },
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
