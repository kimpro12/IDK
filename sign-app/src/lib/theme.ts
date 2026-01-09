import { ColorSchemeName, TextStyle } from 'react-native';

const typographyBase = {
  title: {
    fontSize: 28,
    fontWeight: '600',
  } satisfies TextStyle,
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
  } satisfies TextStyle,
  caption: {
    fontSize: 14,
    fontWeight: '400',
  } satisfies TextStyle,
};

export const lightTheme = {
  colors: {
    background: '#F6F5F3',
    card: '#FFFFFF',
    text: '#1E1B1B',
    mutedText: '#5E5E5E',
    primary: '#4E5EE8',
    border: '#E2E0DD',
    shadow: 'rgba(20, 20, 20, 0.2)',
    ritualBackground: '#0C0D12',
    ritualGlow: '#7C83FF',
    particle: 'rgba(196, 200, 255, 0.6)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  typography: typographyBase,
};

export const darkTheme = {
  colors: {
    background: '#111111',
    card: '#1C1C1E',
    text: '#F5F5F5',
    mutedText: '#B3B3B3',
    primary: '#8B9CFF',
    border: '#2A2A2A',
    shadow: 'rgba(0, 0, 0, 0.6)',
    ritualBackground: '#0C0D12',
    ritualGlow: '#7C83FF',
    particle: 'rgba(196, 200, 255, 0.6)',
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  typography: typographyBase,
};

export type Theme = typeof lightTheme;

export const getTheme = (scheme: ColorSchemeName): Theme =>
  scheme === 'dark' ? darkTheme : lightTheme;
