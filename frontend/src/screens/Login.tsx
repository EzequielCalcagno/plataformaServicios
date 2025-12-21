// src/screens/Login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useSession } from '../context/SessionContext';

import { Screen } from '../components/Screen';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { COLORS, SPACING, TYPO } from '../styles/theme';

const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState('ezequielcalcagno@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const { login } = useSession();

  const handleLoginPress = async () => {
    setAlertMsg(null);
    setOk(false);

    if (!email || !password) {
      setAlertMsg('El email y la contraseña son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);


      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setAlertMsg(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/fixo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[TYPO.h1, styles.title]}>¡Qué bueno verte de nuevo!</Text>

          <Text style={[TYPO.subtitle, styles.subtitle]}>
            Todo lo que necesitás para contratar o trabajar, en un solo lugar.
          </Text>

          {alertMsg && (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.md }}
            />
          )}

          <Input
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title={loading ? 'Ingresando...' : 'Continuar'}
            onPress={handleLoginPress}
            disabled={loading}
            variant="primary"
            size="lg"
          />

          <Text style={styles.footer}>
            ¿Todavía no tenés cuenta?{' '}
            <Text style={TYPO.link} onPress={() => navigation.navigate('Register')}>
              Crear una
            </Text>
          </Text>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line}></View>
            <Text style={styles.or}>o</Text>
            <View style={styles.line}></View>
          </View>

          {/* Social buttons (visual only por ahora) */}
          <View style={styles.socialBtnsContainer}>
            <Button
              title="Continuá con Apple"
              onPress={() => console.log('Apple')}
              variant="social"
              size="lg"
              leftIcon={
                <Image
                  source={require('../../assets/images/apple-logo.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              }
            />

            <Button
              title="Continuá con Google"
              onPress={() => console.log('Google')}
              variant="social"
              size="lg"
              leftIcon={
                <Image
                  source={require('../../assets/images/google-logo.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 90,
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoButton: {
    width: 20,
    height: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
    color: COLORS.textMuted,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bgDivider,
  },
  or: {
    marginHorizontal: 10,
    color: COLORS.bgDivider,
    fontSize: 13,
  },
  socialBtnsContainer: {
    gap: 12,
  },
});
