// src/styles/theme.ts
const FONTS = {
  light: 'Cereal-Light',
  regular: 'Cereal-Regular',
  medium: 'Cereal-Medium',
  bold: 'Cereal-Bold',
  extraBold: 'Cereal-ExtraBold',
};

export const COLORS = {
  // General
  primaryBrilliant: '#2294F2',
  primary: '#2E4766',
  secondary: '#4F7096',

  text: '#0D141C',
  textMuted: '#667082',

  bgLightGrey: '#F2F2F2',

  // Figma colors
  bgScreen: '#FAFAFA',
  cardBg: '#FFFFFF',
  border: '#E9E9E9',
  textInput: '#4F7096',
  bgInput: '#FFFFFF',
  borderInput: '#E9E9E9',
  bgDivider: '#E8EDF2',

  // Tab Bar
  tabBarBg: '#FAFAFA',
  borderTab: '#E8EDF2',
  activeTab: '#0D141C',
  inactiveTab: '#4F7096',

  // Buttons
  buttonPrimaryBg: '#2294F2',
  buttonPrimaryText: '#FFFFFF',

  buttonOutlineBg: 'transparent',
  buttonOutlineBorder: '#2294F2',
  buttonOutlineText: '#2294F2',

  buttonNeutralBg: 'transparent',
  buttonNeutralBorder: '#E9E9E9',
  buttonNeutralText: '#0D141C',
  
  buttonSocialBg: 'transparent',
  buttonSocialBorder: '#E9E9E9',
  buttonSocialText: '#0D141C',
  graySoft: '#F3F4F6',  // gris suave tipo “pill/bg”
  danger: '#EF4444',    // rojo de alerta (dot / warning)
  bg: '#FAFAFA',        // alias práctico (igual a bgScreen)
};

export const RADII = {
  xs: 6,
  sm: 10,
  md: 20,
  lg: 24,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

/**
 * Typography scale (RN friendly)
 * - Usa estilos listos para <Text style={[TYPO.h1, ...]} />
 * - Mantiene consistencia tipo Uber/Airbnb (títulos fuertes + body legible)
 */
export const TYPO = {
  // Display / Hero
  display: {
    fontFamily: FONTS.extraBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: COLORS.text,
  },

  // Headings
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: COLORS.text,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: COLORS.text,
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.text,
  },

  // Subtitles
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.textMuted,
  },

  // Body
  body: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  bodyMuted: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },

  // UI text
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
  helper: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.textMuted,
  },

  // Links
  link: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.primary,
    textDecorationLine: 'underline' as const,
  },

  // Small badges / chips
  badge: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.text,
  },
} as const;
