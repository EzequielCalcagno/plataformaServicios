import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPO } from '../styles/theme';

type Props = {
  title: string;
  showBack?: boolean;
  onPressBack?: () => void;
  rightNode?: React.ReactNode;
};

const SIDE = 42;

export const TopBar: React.FC<Props> = ({ title, showBack = false, onPressBack, rightNode }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* LEFT */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity
            onPress={onPressBack || navigation.goBack}
            style={styles.iconButton}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* TITLE */}
      <Text numberOfLines={1} style={[TYPO.h2, styles.title]}>
        {title}
      </Text>

      {/* RIGHT */}
      <View style={styles.side}>{rightNode}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  side: {
    width: SIDE,
    height: SIDE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconButton: {
    width: SIDE,
    height: SIDE,
    borderRadius: 999,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    flex: 1,
    textAlign: 'center',
  },
});
