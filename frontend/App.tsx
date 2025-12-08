// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Home from './src/screens/Home';
import Profile from './src/screens/Profile';
import AddService from './src/screens/AddService';
import EditProfile from './src/screens/EditProfile';
import Jobs from './src/screens/Jobs'; // para Bookings
import Search from './src/screens/Search'; // para Search

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  EditProfile: undefined;
  AddService: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Usamos any para no pelearnos con los tipos del Tab
const Tab = createBottomTabNavigator<any>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Search') iconName = 'search-outline';
          if (route.name === 'Bookings') iconName = 'calendar-outline';
          if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home as any} />
      <Tab.Screen name="Search" component={Search as any} options={{ title: 'Search' }} />
      <Tab.Screen name="Bookings" component={Jobs as any} options={{ title: 'Bookings' }} />
      <Tab.Screen name="Profile" component={Profile as any} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />

          {/* Contenedor con las tabs inferiores */}
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Pantallas auxiliares que se abren desde tabs */}
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="AddService" component={AddService} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
