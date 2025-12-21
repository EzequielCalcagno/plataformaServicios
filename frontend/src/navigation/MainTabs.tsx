// src/navigation/MainTabs.tsx
import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Search from '../screens/Search';
import Jobs from '../screens/Jobs';
import Account from '../screens/Account';

import { COLORS } from '../styles/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, any> = {
  Inicio: require('../../assets/icons/menu/inicio.png'),
  Buscar: require('../../assets/icons/menu/buscar.png'),
  'Mis trabajos': require('../../assets/icons/menu/trabajos.png'),
  Cuenta: require('../../assets/icons/menu/cuenta.png'),
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.activeTab,
        tabBarInactiveTintColor: COLORS.inactiveTab,
        tabBarStyle: {
          backgroundColor: COLORS.tabBarBg,
          borderTopColor: COLORS.borderTab,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 6,
        },
        tabBarIcon: ({ focused }) => {
          const icon = TAB_ICONS[route.name];

          return (
            <Image
              source={icon}
              resizeMode="contain"
              style={{
                width: 32,
                height: 32,
                tintColor: focused ? COLORS.activeTab : COLORS.inactiveTab,
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Inicio" component={Home as any} />
      <Tab.Screen name="Buscar" component={Search as any} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Mis trabajos" component={Jobs as any} options={{ title: 'Mis trabajos' }} />
      <Tab.Screen name="Cuenta" component={Account as any} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}
