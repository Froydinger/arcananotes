
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'serif': ['Space Grotesk', 'Georgia', 'serif'],
				'sans': ['DM Sans', 'system-ui', 'sans-serif'],
				'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
				'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				noteily: {
					50: '#faf9f7',
					100: '#f3f2ef',
					200: '#e8e6e1',
					300: '#d6d3cc',
					400: '#b8b3a9',
					500: '#9a9488',
					600: '#7d766a',
					700: '#656057',
					800: '#534f48',
					900: '#46433d',
					950: '#252320',
				},
				blue: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem'
			},
			boxShadow: {
				'glow': '0 0 15px hsl(var(--accent) / 0.3)',
				'glow-sm': '0 0 8px hsl(var(--accent) / 0.25)',
				'glow-lg': '0 0 25px hsl(var(--accent) / 0.4)',
				'elevated': '0 4px 20px hsl(var(--foreground) / 0.08), 0 8px 32px hsl(var(--foreground) / 0.04)',
				'elevated-lg': '0 8px 32px hsl(var(--foreground) / 0.1), 0 16px 48px hsl(var(--foreground) / 0.06)',
				'inner-glow': 'inset 0 1px 0 hsl(var(--foreground) / 0.05)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(8px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(8px)'
					}
				},
				'float-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(12px) scale(0.97)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'gentle-bounce': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-3px)'
					}
				},
				'slide-up-smooth': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
				},
				'shimmer': {
					'0%': {
						transform: 'translateX(-100%)',
					},
					'100%': {
						transform: 'translateX(100%)',
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1',
					},
					'50%': {
						opacity: '0.75',
					}
				},
				'gradient-shift': {
					'0%': {
						backgroundPosition: '0% 50%'
					},
					'50%': {
						backgroundPosition: '100% 50%'
					},
					'100%': {
						backgroundPosition: '0% 50%'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
				'accordion-up': 'accordion-up 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
				'fade-in': 'fade-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
				'fade-out': 'fade-out 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
				'float-in': 'float-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
				'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
				'gentle-bounce': 'gentle-bounce 2.5s ease-in-out infinite',
				'slide-up-smooth': 'slide-up-smooth 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
				'shake': 'shake 0.3s ease-in-out',
				'shimmer': 'shimmer 1.5s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 8s ease infinite'
			},
			transitionDuration: {
				'250': '250ms',
				'350': '350ms',
				'400': '400ms',
			},
			transitionTimingFunction: {
				'bounce-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
