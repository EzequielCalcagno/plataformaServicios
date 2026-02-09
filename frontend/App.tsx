// App.tsx
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { SessionProvider } from './src/context/SessionContext';

import Login from './src/screens/Login';
import Register from './src/screens/Register';

// Perfil para ver otros profesionales
import Profile from './src/screens/Profile';
import Reviews from './src/screens/Reviews';
import AddService from './src/screens/AddService';
import EditProfile from './src/screens/EditProfile';
import LocationPicker from './src/screens/LocationPicker';
import Locations from './src/screens/Locations';
import LocationFormScreen from './src/screens/LocationForm';
import ReservationDetail from './src/screens/ReservationDetail';
import RateReservation from './src/screens/RateReservation';
import CreateRequest from './src/screens/CreateRequest';
import MyServicesManager from './src/screens/MyServicesManager';

import ProfessionalServices from './src/screens/ProfessionalServices';

import MainTabs from './src/navigation/MainTabs';
import BecomePro from './src/screens/BecomePro';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  BecomePro: undefined;
  Reviews: undefined;
  EditProfile: { fromBecomePro?: boolean } | undefined;
  AddService: { fromBecomePro?: boolean } | undefined;
  Locations: { fromBecomePro?: boolean } | undefined;
  LocationPicker: undefined;
  LocationForm: undefined;

  // Perfil de otro profesional
  ProfessionalProfile: { profesionalId: string };

  // Solicitar servicio
  CreateRequest: { profesionalId: string };

  // Servicios del profesional seleccionado
  ProfessionalServices: { profesionalId: string };

  Requests: undefined;
  ReservationDetail: undefined;
  RateReservation: undefined;
  MyServicesManager: undefined;
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

            {/* Pantalla para convertirse en profesional */}
            <Stack.Screen name="BecomePro" component={BecomePro} />

            {/* Pantallas auxiliares que se abren desde tabs */}
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="AddService" component={AddService} />
            <Stack.Screen name="Locations" component={Locations} />

            {/* Pantallas de Locations */}
            <Stack.Screen name="LocationForm" component={LocationFormScreen} />
            <Stack.Screen name="LocationPicker" component={LocationPicker} />

            <Stack.Screen name="ReservationDetail" component={ReservationDetail as any} />

            {/* Perfil público */}
            <Stack.Screen name="ProfessionalProfile" component={Profile as any} />
            <Stack.Screen name="Reviews" component={Reviews} />

            {/* ✅ Servicios del profesional seleccionado */}
            <Stack.Screen name="ProfessionalServices" component={ProfessionalServices as any} />

            {/* ✅ Solicitar servicio */}
            <Stack.Screen name="CreateRequest" component={CreateRequest as any} />
            <Stack.Screen name="MyServicesManager" component={MyServicesManager as any} />

            <Stack.Screen name="RateReservation" component={RateReservation as any} />
          </Stack.Navigator>
        </SessionProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
