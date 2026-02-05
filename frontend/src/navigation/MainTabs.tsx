// src/navigation/MainTabs.tsx
import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Search from '../screens/Search';
import Bookings from '../screens/Bookings';
import Account from '../screens/Account';

import { COLORS, RADII, SPACING, TYPO, SHADOWS } from '../styles/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, any> = {
  Inicio: require('../../assets/icons/menu/inicio.png'),
  Buscar: require('../../assets/icons/menu/buscar.png'),
  Solicitudes: require('../../assets/icons/menu/solicitudes.png'),
  Cuenta: require('../../assets/icons/menu/cuenta.png'),
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icon = TAB_ICONS[routeName];

  return (
    <View style={styles.iconSlot}>
      <View style={[styles.indicator, focused && styles.indicatorOn]} />
      <Image
        source={icon}
        resizeMode="contain"
        style={[styles.icon, { tintColor: focused ? COLORS.activeTab : COLORS.inactiveTab }]}
      />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // Labels
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: COLORS.activeTab,
        tabBarInactiveTintColor: COLORS.inactiveTab,

        // Layout
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.item,

        // Icon
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Inicio" component={Home as any} />
      <Tab.Screen name="Buscar" component={Search as any} options={{ title: 'Buscar' }} />
      <Tab.Screen
        name="Solicitudes"
        component={Bookings as any}
        options={{ title: 'Solicitudes' }}
      />
      <Tab.Screen name="Cuenta" component={Account as any} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: { width: 28, height: 28 },

  label: {
    ...TYPO.caption,
    marginTop: 3,
  },

  tabBar: {
    backgroundColor: COLORS.tabBarBg,
    borderTopColor: COLORS.borderTab,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 86 : 70,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingTop: 10,
  },

  item: {
    paddingTop: 4,
  },

  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapActive: {
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconSlot: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  indicator: {
    width: 18,
    height: 3,
    borderRadius: RADII.pill,
    backgroundColor: 'transparent',
  },

  indicatorOn: {
    backgroundColor: COLORS.primaryBrilliant,
  },
});
