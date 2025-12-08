// src/navigation/MainMenu.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppCard } from '../components/AppCard';
import { COLORS, SPACING, RADII } from '../styles/theme';

type Role = 'client' | 'professional';

type MenuConfigItem = {
  key: string;
  label: string;
  route: string;
  params?: Record<string, any>;
};

const MENUS: Record<Role, MenuConfigItem[]> = {
  client: [
    {
      key: 'search',
      label: 'Buscar profesionales',
      route: 'Search',
    },
    {
      key: 'requests',
      label: 'Mis solicitudes',
      route: 'Requests', // la podés crear después, por ahora puede ser un placeholder
    },
    {
      key: 'bookings',
      label: 'Trabajos en curso',
      route: 'Bookings',
    },
    {
      key: 'profile',
      label: 'Mi perfil',
      route: 'Profile',
      params: { role: 'client' },
    },
  ],
  professional: [
    {
      key: 'incoming',
      label: 'Solicitudes recibidas',
      route: 'Bookings',
    },
    {
      key: 'jobs',
      label: 'Trabajos activos',
      route: 'Bookings',
    },
    {
      key: 'add-service',
      label: 'Mis servicios',
      route: 'AddService',
    },
    {
      key: 'profile',
      label: 'Mi perfil profesional',
      route: 'EditProfile',
    },
  ],
};

type MainMenuProps = {
  role: Role;
};

export function MainMenu({ role }: MainMenuProps) {
  const navigation = useNavigation<any>();
  const items = MENUS[role];

  return (
    <View style={styles.menuGrid}>
      {items.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.item}
          activeOpacity={0.9}
          onPress={() => navigation.navigate(item.route, item.params ?? {})}
        >
          <AppCard style={styles.menuCard} withShadow>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </AppCard>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    marginTop: SPACING.sm,
  },
  item: {
    flexBasis: '48%',
  },
  menuCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: RADII.lg,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});
