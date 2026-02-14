// src/components/AppInput.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { COLORS, RADII, SPACING, TYPO, SHADOWS } from '../styles/theme';

type InputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string | null;
  disabled?: boolean;
  prefixText?: string;
  prefixStyle?: StyleProp<ViewStyle>;
};

export const Input: React.FC<InputProps> = ({
  label,
  containerStyle,
  style,
  error,
  disabled = false,
  prefixText,
  prefixStyle,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        {prefixText ? <Text style={[styles.prefixText, prefixStyle]}>{prefixText}</Text> : null}

        <TextInput
          style={
            disabled ? [styles.input, style, { color: COLORS.textMuted }] : [styles.input, style]
          }
          placeholderTextColor={COLORS.textInput}
          underlineColorAndroid="transparent"
          editable={!disabled}
          textAlignVertical="center"
          {...rest}
        />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },

  label: {
    ...TYPO.label,
    marginLeft: 4,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 16,

    
    ...SHADOWS.soft,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  inputWrapperError: {
    borderColor: COLORS.danger,
  },

  prefixText: {
    marginRight: 8,
    fontFamily: TYPO.body.fontFamily,
    fontSize: TYPO.body.fontSize,
    lineHeight: TYPO.body.lineHeight,
    color: COLORS.textInput,
    marginTop: 1, 
  },

  input: {
    flex: 1, 
    minWidth: 0, 
    fontFamily: TYPO.body.fontFamily,
    fontSize: TYPO.body.fontSize,
    lineHeight: TYPO.body.lineHeight,
    color: COLORS.textInput,
    padding: 0, 
    margin: 0,
  },

  error: {
    marginTop: 6,
    fontFamily: TYPO.helper.fontFamily,
      fontSize: TYPO.body.fontSize,
      color: COLORS.danger,
  },
});
