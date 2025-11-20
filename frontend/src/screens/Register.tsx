// src/screens/Register.tsx
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { register } from '../services/auth.client';

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

    // Podés hacerlo obligatorio si querés
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
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Encontrá técnicos confiables cerca de vos en Uruguay.</Text>

          {/* Alertas */}
          {alertMsg ? (
            <Text style={[styles.alert, ok ? styles.alertOk : styles.alertErr]}>{alertMsg}</Text>
          ) : null}

          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            placeholderTextColor={COLORS.muted}
            value={apellido}
            onChangeText={setApellido}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Teléfono */}
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+598 99 123 123"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />

          {/* Rol */}
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segmentBtn, rol === 'cliente' && styles.segmentActive]}
              onPress={() => setRol('cliente')}
            >
              <Text style={[styles.segmentText, rol === 'cliente' && styles.segmentTextActive]}>
                Cliente
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, rol === 'profesional' && styles.segmentActive]}
              onPress={() => setRol('profesional')}
            >
              <Text style={[styles.segmentText, rol === 'profesional' && styles.segmentTextActive]}>
                Profesional
              </Text>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creando...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>

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
  );
};

export default Register;

/* ===== Colores y estilo alineados al HTML ===== */
const COLORS = {
  bg: '#f7f9fc',
  text: '#1f2937',
  muted: '#6b7280',
  input: '#e9eef5',
  border: '#dbe3ef',
  primary: '#1d8cff',
  primary600: '#1876d9',
  ok: '#166534',
  okBg: '#dcfce7',
  okBd: '#bbf7d0',
  err: '#b91c1c',
  errBg: '#fee2e2',
  errBd: '#fecaca',
  link: '#0f60e6',
};

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
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 6,
    marginBottom: 22,
  },
  alert: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertOk: { color: COLORS.ok, backgroundColor: COLORS.okBg, borderColor: COLORS.okBd },
  alertErr: { color: COLORS.err, backgroundColor: COLORS.errBg, borderColor: COLORS.errBd },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 10,
  },
  segmented: { flexDirection: 'row', marginBottom: 10 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segmentActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  segmentText: { fontWeight: '700', color: COLORS.text },
  segmentTextActive: { color: '#fff' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  termsText: { color: COLORS.muted, fontSize: 13, flex: 1, flexWrap: 'wrap' },
  link: { color: COLORS.link, textDecorationLine: 'underline' },
  button: {
    width: '100%',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    color: COLORS.muted,
  },
  footerLink: { color: COLORS.link, textDecorationLine: 'underline' },
});
