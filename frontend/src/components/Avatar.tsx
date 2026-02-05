import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type Props = { name: string; photoUrl: string | null };

export const Avatar = React.memo(({ name, photoUrl }: Props) => {
  if (photoUrl) return <Image source={{ uri: photoUrl }} style={styles.avatarImg} />;
  const initial = (name?.trim()?.[0] || 'P').toUpperCase();
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
});
Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '900', color: '#374151' },
});
