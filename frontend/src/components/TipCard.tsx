import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image } from 'react-native';

import { COLORS, RADII, SPACING, TYPO, SHADOWS } from '../styles/theme';
import { Card } from './Card';

const BULB_IMG = require('../../assets/icons/bombita.png'); // <-- ajustá si corresponde

type Props = {
  title?: string;
  message: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'softShadow';
};

export const TipCard: React.FC<Props> = ({ title = 'Consejo rápido', message, onPress }) => {
  return (
    <Card onPress={onPress} withShadow={true} style={{ marginTop: SPACING.md }}>
      <View style={styles.wrapper}>
        <View style={styles.iconWrap}>
          <Image source={BULB_IMG} style={styles.icon} resizeMode="contain" />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 24,
    height: 24,
  },

  textWrap: {
    flex: 1,
  },

  title: {
    ...TYPO.h3,
    fontSize: 16,
    lineHeight: 22,
  },

  message: {
    marginTop: 2,
    ...TYPO.caption,
  },
});
