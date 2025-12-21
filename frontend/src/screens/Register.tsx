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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register } from '../services/auth.client';

// 🔹 Componentes genéricos
import { Screen } from '../components/Screen';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';

interface RegisterProps {
  navigation?: any;
}

const Register: React.FC<RegisterProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = async () => {
    setAlertMsg(null);
    setOk(false);

    if (!name.trim()) return setAlertMsg('Ingrese un nombre.');
    if (!apellido.trim()) return setAlertMsg('Ingrese un apellido.');

    if (!email.trim()) return setAlertMsg('Ingrese un email válido.');
    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      return setAlertMsg('Ingrese un email válido.');
    }

    if (!password || password.length < 6) {
      return setAlertMsg('La contraseña debe tener al menos 6 caracteres.');
    }

    if (!telefono.trim()) {
      return setAlertMsg('Ingrese un teléfono de contacto.');
    }
    if (!/^\d{8,9}$/.test(telefono)) {
      return setAlertMsg('Ingrese un teléfono válido de Uruguay.');
    }

    const telefonoNormalizado = telefono.replace(/^0+/, ''); // saca ceros iniciales
    const telefonoCompleto = `+598${telefonoNormalizado}`;

    const payloadForApi = {
      email: email.trim(),
      password,
      nombre: name.trim(),
      apellido: apellido.trim(),
      telefono: telefonoCompleto,
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
    <Screen>
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

          {/* Titulo */}
          <Text style={[TYPO.h1, styles.title]}>Súmate a Fixo</Text>

          {/* Subtitulo */}
          <Text style={[TYPO.subtitle, styles.subtitle]}>
            Buscá servicios o empezá a ofrecer los tuyos. Todo en un solo lugar.
          </Text>

          {/* Alertas */}
          {alertMsg && (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.sm }}
            />
          )}

          {/* Nombre*/}
          <Input
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: SPACING.sm }}
          />

          {/* Apellido */}
          <Input
            placeholder="Apellido"
            value={apellido}
            onChangeText={setApellido}
            style={{ marginBottom: SPACING.sm }}
          />

          {/* Email */}
          <Input
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{ marginBottom: SPACING.sm }}
          />

          {/* Contraseña */}
          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: SPACING.sm }}
          />

          {/* Teléfono */}
          <Input
            placeholder="99 123 123"
            value={telefono}
            onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
            maxLength={8}
            prefixText="+598"
          />

          {/* Botón Crear cuenta */}
          <Button
            title={loading ? 'Creando...' : 'Crear cuenta'}
            onPress={handleSubmit}
            disabled={loading}
            variant="primary"
            size="lg"
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
    </Screen>
  );
};

export default Register;

const styles = StyleSheet.create({
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
    height: 90,
    alignSelf: 'center',
    marginBottom: 12,
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
  link: { color: COLORS.primary, textDecorationLine: 'underline' },
  footer: {
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footerLink: { color: COLORS.primary, textDecorationLine: 'underline' },
});
