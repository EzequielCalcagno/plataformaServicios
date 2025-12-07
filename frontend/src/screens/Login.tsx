// src/screens/Login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/auth.client';
import { decodeJwtPayload } from '../utils/jwt';
import { AppRole, mapRolFromId } from '../utils/roles';

// 🔹 componentes genéricos
import { AppScreen } from '../components/AppScreen';
import { AppInput } from '../components/AppInput';
import { AppAlert } from '../components/AppAlert';
import { AppButton } from '../components/AppButton';
import { COLORS, SPACING } from '../styles/theme';

interface LoginProps {
  navigation?: any;
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const [email, setEmail] = useState('pro@pro.com');
  const [password, setPassword] = useState('propass');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleLoginPress = async () => {
    setAlertMsg(null);
    setOk(false);

    if (!email || !password) {
      setAlertMsg('El email y la contraseña son obligatorios');
      return;
    }

    try {
      setLoading(true);

      const { token } = await login(email.trim(), password);
      const decoded = decodeJwtPayload(token);

      const appRole: AppRole = mapRolFromId(decoded?.rolId);

      await AsyncStorage.multiSet([
        ['@token', token],
        ['@role', appRole],
        ['@userId', decoded?.id ? String(decoded.id) : ''],
      ]);

      setOk(true);
      setAlertMsg('¡Inicio de sesión correcto!');

      navigation?.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setOk(false);
      setAlertMsg(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    navigation?.navigate('Register');
  };

  return (
    <AppScreen style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require('../../assets/images/fixo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Títulos */}
          <Text style={styles.title}>Bienvenido a Fixo</Text>
          <Text style={styles.subtitle}>
            Encontrá técnicos de servicios para el hogar en Uruguay.
          </Text>

          {/* Alertas */}
          {alertMsg && (
            <AppAlert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.sm }}
            />
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <AppInput
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Contraseña + toggle */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.row}>
            <AppInput
              placeholder="Password"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              containerStyle={[styles.inputFlex, { marginBottom: 0 }]}
            />
            <TouchableOpacity
              onPress={() => setSecure(s => !s)}
              style={styles.toggle}
              accessibilityLabel="Mostrar u ocultar contraseña"
            >
              <Text style={styles.toggleText}>
                {secure ? 'Mostrar' : 'Ocultar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón login */}
          <AppButton
            title={loading ? 'Ingresando...' : 'Iniciar sesión'}
            onPress={handleLoginPress}
            disabled={loading}
            style={{ marginTop: SPACING.md }}
          />

          {/* Footer */}
          <Text style={styles.footer}>
            ¿No tenés una cuenta?{' '}
            <Text style={styles.footerLink} onPress={handleSignUpPress}>
              Registrate
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

export default Login;

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  logo: {
    width: 120,
    height: 48,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 6,
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputFlex: {
    flex: 1,
  },
  toggle: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  toggleText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footerLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
