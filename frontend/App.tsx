// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { SessionProvider } from './src/context/SessionContext';

import Login from './src/screens/Login';
import Register from './src/screens/Register';

// Perfil para ver otros profesionales
import Profile from './src/screens/Profile';

import AddService from './src/screens/AddService';
import EditProfile from './src/screens/EditProfile';
import LocationPicker from './src/screens/LocationPicker';
import Locations from './src/screens/Locations'; // para Locations
import LocationFormScreen from './src/screens/LocationForm'; // para LocationForm
import MainTabs from './src/navigation/MainTabs';
import Bookings from './src/screens/Bookings';
import ReservationDetail from './src/screens/ReservationDetail';

// ✅ NUEVO
import CreateRequest from './src/screens/CreateRequest';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;

  EditProfile: undefined;
  AddService: undefined;
  LocationPicker: undefined;
  LocationForm: undefined;

  // Perfil de otro profesional
  ProfessionalProfile: { profesionalId: string };

  // ✅ CreateRequest (solicitar servicio)
  CreateRequest: { profesionalId: string };

  ReservationDetail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Cereal-Light': require('./assets/fonts/Cereal/Cereal_Light.otf'),
    'Cereal-Regular': require('./assets/fonts/Cereal/Cereal_Regular.otf'),
    'Cereal-Medium': require('./assets/fonts/Cereal/Cereal_Medium.otf'),
    'Cereal-Bold': require('./assets/fonts/Cereal/Cereal_Bold.otf'),
    'Cereal-ExtraBold': require('./assets/fonts/Cereal/Cereal_ExtraBold.otf'),
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SessionProvider>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />

            {/* Contenedor con las tabs inferiores */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Pantallas auxiliares que se abren desde tabs */}
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="AddService" component={AddService} />

            {/* Pantallas de Locations */}
            <Stack.Screen name="LocationForm" component={LocationFormScreen} />
            <Stack.Screen name="LocationPicker" component={LocationPicker} />

            <Stack.Screen name="ReservationDetail" component={ReservationDetail as any} />
          {/* Perfil público */}
          <Stack.Screen name="ProfessionalProfile" component={Profile as any} />

          {/* ✅ Solicitar servicio */}
          <Stack.Screen name="CreateRequest" component={CreateRequest as any} />
          </Stack.Navigator>
        </SessionProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
