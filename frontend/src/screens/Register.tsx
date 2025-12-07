// src/screens/Register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register } from '../services/auth.client';

// 🔹 Componentes genéricos
import { AppScreen } from '../components/AppScreen';
import { AppInput } from '../components/AppInput';
import { AppAlert } from '../components/AppAlert';
import { AppButton } from '../components/AppButton';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

interface RegisterProps {
  navigation?: any;
}

const Register: React.FC<RegisterProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<'cliente' | 'profesional'>('cliente');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const splitName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    const nombre = parts.shift() || '';
    const apellido = parts.join(' ') || '';
    return { nombre, apellido };
  };

  const handleSubmit = async () => {
    setAlertMsg(null);
    setOk(false);

    if (!name.trim()) return setAlertMsg('Ingresá un nombre.');
    if (!apellido.trim()) return setAlertMsg('Ingresá un apellido.');

    if (!email.trim()) return setAlertMsg('Ingresá un email válido.');
    if (!password || password.length < 6) {
      return setAlertMsg('La contraseña debe tener al menos 6 caracteres.');
    }

    if (!telefono.trim()) {
      return setAlertMsg('Ingresá un teléfono de contacto.');
    }

    if (!termsAccepted) {
      return setAlertMsg('Debés aceptar Términos y Privacidad.');
    }

    const payloadForApi = {
      email: email.trim(),
      password,
      rol, // 'cliente' | 'profesional'
      nombre: name.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    };

    try {
      setLoading(true);

      await register(payloadForApi);

      setOk(true);
      setAlertMsg('¡Cuenta creada con éxito!');

      setTimeout(() => {
        navigation?.replace?.('Login');
      }, 500);
    } catch (e: any) {
      setOk(false);
      setAlertMsg(e?.message ?? 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
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
            <SectionTitle style={styles.title}>Crea tu cuenta</SectionTitle>
            <Text style={styles.subtitle}>
              Encontrá técnicos confiables cerca de vos en Uruguay.
            </Text>

            {/* Alertas */}
            {alertMsg && (
              <AppAlert
                type={ok ? 'success' : 'error'}
                message={alertMsg}
                style={{ marginBottom: SPACING.sm }}
              />
            )}

            {/* Nombre*/}
            <AppInput
              label="Nombre"
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
              style={{ marginBottom: SPACING.sm }}
            />

            {/* Apellido */}
            <AppInput
              label="Apellido"
              placeholder="Apellido"
              value={apellido}
              onChangeText={setApellido}
              style={{ marginBottom: SPACING.sm }}
            />

            {/* Email */}
            <AppInput
              label="Email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={{ marginBottom: SPACING.sm }}
            />

            {/* Contraseña */}
            <AppInput
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ marginBottom: SPACING.sm }}
            />

            {/* Teléfono */}
            <AppInput
              label="Teléfono"
              placeholder="+598 99 123 123"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              style={{ marginBottom: SPACING.sm }}
            />

            {/* Rol */}
            <View style={styles.segmented}>
              <AppButton
                title="Cliente"
                variant={rol === 'cliente' ? 'primary' : 'outline'}
                onPress={() => setRol('cliente')}
                style={{ flex: 1, marginRight: SPACING.xs }}
              />
              <AppButton
                title="Profesional"
                variant={rol === 'profesional' ? 'primary' : 'outline'}
                onPress={() => setRol('profesional')}
                style={{ flex: 1, marginLeft: SPACING.xs }}
              />
            </View>

            {/* Términos */}
            <View style={styles.termsRow}>
              <Switch
                value={termsAccepted}
                onValueChange={setTermsAccepted}
                trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
                thumbColor="#ffffff"
                ios_backgroundColor="#cbd5e1"
              />
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.link} onPress={() => Alert.alert('Términos', 'Pendiente.')}>
                  Términos
                </Text>{' '}
                y la{' '}
                <Text style={styles.link} onPress={() => Alert.alert('Privacidad', 'Pendiente.')}>
                  Privacidad
                </Text>
                .
              </Text>
            </View>

            {/* Botón Crear cuenta */}
            <AppButton
              title={loading ? 'Creando...' : 'Crear cuenta'}
              onPress={handleSubmit}
              disabled={loading}
              style={styles.mainButton}
            />

            {/* Footer */}
            <Text style={styles.footer}>
              ¿Ya tenés cuenta?{' '}
              <Text style={styles.footerLink} onPress={() => navigation?.navigate('Login')}>
                Iniciar sesión
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppScreen>
  );
};

export default Register;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + SPACING.md,
  },
  logo: {
    width: 120,
    height: 48,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 6,
    marginBottom: SPACING.lg + SPACING.sm,
  },
  segmented: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  termsText: {
    color: COLORS.textMuted,
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
    marginLeft: SPACING.sm,
  },
  link: { color: COLORS.primary, textDecorationLine: 'underline' },
  mainButton: {
    marginTop: SPACING.md,
    borderRadius: RADII.md,
  },
  footer: {
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footerLink: { color: COLORS.primary, textDecorationLine: 'underline' },
});
