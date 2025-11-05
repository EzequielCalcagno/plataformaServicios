import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import Login from './src/screens/Login';
import Register from './src/screens/Register';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    ManropeRegular: require('./assets/fonts/Manrope/Regular.ttf'),
    ManropeMedium: require('./assets/fonts/Manrope/Medium.ttf'),
    ManropeBold: require('./assets/fonts/Manrope/Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={styles.container}>
        <NavigationContainer>
          {/* <Stack.Navigator initialRouteName="login">
            <Stack.Screen name="login" options={{ headerShown: false }} component={Login} />
          </Stack.Navigator> */}
          <Stack.Navigator initialRouteName="register">
            <Stack.Screen name="register" options={{ headerShown: false }} component={Register} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
