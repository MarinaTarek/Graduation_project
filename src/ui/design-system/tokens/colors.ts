/**
 * Design System Color Tokens
 * Single source of truth for color values and CSS variables.
 */

export const colors = {
  // Brand & Accent Colors
  mist: 'var(--mist, #C0E6FD)',
  sky: 'var(--sky, #80AAD3)',
  steel: 'var(--steel, #5B86B6)',
  ocean: 'var(--ocean, #3F6593)',
  navy: 'var(--navy, #1B3554)',
  midnight: 'var(--midnight, #000F22)',

  // Surfaces & Backgrounds
  paper: 'var(--paper, #FFFFFF)',
  tint: 'var(--tint, #F4FAFF)',

  // Status & Feedback
  green: 'var(--green, #7FC8A9)',
  greenBg: 'var(--green-bg, #E6F5EE)',
  greenText: 'var(--green-text, #318362)',
  amber: 'var(--amber, #E8B86D)',
  amberBg: 'var(--amber-bg, #FBF1DC)',
  amberText: 'var(--amber-text, #9b6e21)',
  rose: 'var(--rose, #D9798B)',
  roseBg: 'var(--rose-bg, #F8E4E8)',
  roseText: 'var(--rose-text, #a84c61)',

  // Neutrals & Utility
  inkSoft: 'var(--ink-soft, #62809f)',
  borderSubtle: 'var(--border-subtle, #edf5fa)',
  borderLight: 'var(--border-light, #dcecf7)',
  cardBg: 'var(--card-bg, #FFFFFF)',
} as const

export type ColorToken = keyof typeof colors
