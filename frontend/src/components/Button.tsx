// src/components/AppButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { COLORS, RADII, TYPO } from '../styles/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'neutral' | 'social';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode; // 👈 para Apple/Google
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled = false,
  style,
  textStyle,
  leftIcon,
}) => {
  const isPrimary = variant === 'primary';
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        isLg ? styles.lg : isSm ? styles.sm : styles.md,
        isPrimary
          ? styles.primary
          : variant === 'outline'
            ? styles.outline
            : variant === 'neutral'
              ? styles.neutral
              : styles.social,
        fullWidth && { alignSelf: 'stretch' },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

        <Text
          style={[
            styles.text,
            isLg ? styles.textLg : isSm ? styles.textSm : styles.textMd,
            isPrimary
              ? styles.textPrimary
              : variant === 'outline'
                ? styles.textOutline
                : variant === 'neutral'
                  ? styles.textNeutral
                  : styles.textSocial,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
  },

  primary: {
    backgroundColor: COLORS.buttonPrimaryBg,
    borderColor: COLORS.buttonPrimaryBg,
  },
  outline: {
    backgroundColor: COLORS.buttonOutlineBg,
    borderColor: COLORS.buttonOutlineBorder,
  },
  neutral: {
    backgroundColor: COLORS.buttonNeutralBg,
    borderColor: COLORS.buttonNeutralBorder,
  },
  social: {
    backgroundColor: COLORS.buttonSocialBg,
    borderColor: COLORS.buttonSocialBorder,
  },

  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },

  text: {
    // default, se pisa por textMd/textLg
    fontFamily: TYPO.body.fontFamily,
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontFamily: TYPO.body.fontFamily,
    fontSize: 14,
  },
  textLg: {
    fontSize: 16,
  },

  textPrimary: {
    color: COLORS.buttonPrimaryText,
    fontSize: 15,
  },
  textOutline: {
    color: COLORS.buttonOutlineText,
    fontSize: 15,
  },
  textNeutral: {
    color: COLORS.buttonNeutralText,
    fontSize: 15,
  },
  textSocial: {
    color: COLORS.buttonSocialText,
    fontSize: 15,
  },

  disabled: { opacity: 0.6 },
});

export default Button;
