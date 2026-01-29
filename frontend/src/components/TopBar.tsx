import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADII } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  showBack?: boolean;
  onPressBack?: () => void;
  rightNode?: React.ReactNode;
};

export const TopBar: React.FC<Props> = ({ title, showBack = false, onPressBack, rightNode }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* LEFT */}
      {showBack ? (
        <TouchableOpacity onPress={onPressBack || navigation.goBack} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}

      {/* TITLE */}
      <Text style={styles.title}>{title}</Text>

      {/* RIGHT */}
      {rightNode ? rightNode : <View style={{ width: 24 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 20,
  },
  iconButton: {
    padding: 4,
    borderRadius: RADII.sm,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: COLORS.text,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
