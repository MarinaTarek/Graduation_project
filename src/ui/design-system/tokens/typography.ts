/**
 * Design System Typography Tokens
 */

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, serif',
  },
  fontSize: {
    hero: 'clamp(38px, 5vw, 68px)',
    titleLarge: '43px',
    titleMedium: '36px',
    h1: '28px',
    h2: '22px',
    h3: '20px',
    bodyLarge: '19px',
    body: '15px',
    bodyMedium: '14px',
    bodySmall: '13px',
    caption: '12px',
    micro: '11px',
    badge: '10px',
    nano: '9px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tighter: '-.08em',
    tight: '-.06em',
    headline: '-.05em',
    normal: 'normal',
    wide: '.12em',
    wider: '.16em',
  },
} as const
