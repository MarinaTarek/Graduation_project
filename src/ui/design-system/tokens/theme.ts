/**
 * Theme tokens and variable definitions for Light and Dark modes.
 * Dark mode works strictly through theme variables.
 */

export interface ThemeVariables {
  mist: string
  sky: string
  steel: string
  ocean: string
  navy: string
  midnight: string
  paper: string
  tint: string
  green: string
  greenBg: string
  amber: string
  amberBg: string
  rose: string
  roseBg: string
  inkSoft: string
  shadow: string
  radius: string
  bodyText?: string
  mutedText?: string
  linkText?: string
  borderSubtle?: string
  inputBg?: string
  inputBorder?: string
  primaryBtnBg?: string
  primaryBtnText?: string
  secondaryBtnBg?: string
  secondaryBtnText?: string
}

export const lightTheme: ThemeVariables = {
  mist: '#C0E6FD',
  sky: '#80AAD3',
  steel: '#5B86B6',
  ocean: '#3F6593',
  navy: '#1B3554',
  midnight: '#000F22',
  paper: '#FFFFFF',
  tint: '#F4FAFF',
  green: '#7FC8A9',
  greenBg: '#E6F5EE',
  amber: '#E8B86D',
  amberBg: '#FBF1DC',
  rose: '#D9798B',
  roseBg: '#F8E4E8',
  inkSoft: '#62809f',
  shadow: '0 18px 60px rgba(27, 53, 84, .08)',
  radius: '28px',
  bodyText: '#000F22',
  mutedText: '#5B86B6',
  linkText: '#3F6593',
  borderSubtle: '#edf5fa',
  inputBg: '#F4FAFF',
  inputBorder: '#dcecf7',
  primaryBtnBg: '#3F6593',
  primaryBtnText: '#FFFFFF',
  secondaryBtnBg: '#FFFFFF',
  secondaryBtnText: '#3F6593',
}

export const darkTheme: ThemeVariables = {
  mist: '#C0E6FD',
  sky: '#80AAD3',
  steel: '#B4BFCC',
  ocean: '#3F6593',
  navy: '#1D3553',
  midnight: '#F0EDE6',
  paper: '#152840',
  tint: '#0E1B2C',
  green: '#8FD6B6',
  greenBg: '#17382E',
  amber: '#EBC27F',
  amberBg: '#3B3119',
  rose: '#E593A3',
  roseBg: '#3F222C',
  inkSoft: '#6A84A3',
  shadow: 'none',
  radius: '28px',
  bodyText: '#DAD9D6',
  mutedText: '#8494A8',
  linkText: '#9CC3E8',
  borderSubtle: 'rgba(192, 230, 253, .08)',
  inputBg: '#274566',
  inputBorder: 'rgba(192, 230, 253, .08)',
  primaryBtnBg: '#80AAD3',
  primaryBtnText: '#0E1B2C',
  secondaryBtnBg: '#274566',
  secondaryBtnText: '#9CC3E8',
}
