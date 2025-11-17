// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Profile from './src/screens/Profile';
import AddService from './src/screens/AddService';
import EditProfile from './src/screens/EditProfile';
import Jobs from './src/screens/Jobs';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Profile: { role: 'professional' | 'client' };
  EditProfile: undefined;
  AddService: undefined;
  Jobs: undefined; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />

          {/* Perfil (cliente o profesional según role) */}
          <Stack.Screen name="Profile" component={Profile} />

          {/* Pantallas auxiliares */}
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="AddService" component={AddService} />
          <Stack.Screen name="Jobs" component={Jobs} /> 
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
