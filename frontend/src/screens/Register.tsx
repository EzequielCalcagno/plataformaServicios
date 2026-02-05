// src/screens/Register.tsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { register } from '../services/auth.client';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';

import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';

interface RegisterProps {
  navigation?: any;
}

const emailLooksOk = (s: string) => {
  const v = s.trim().toLowerCase();
  return v.includes('@') && v.includes('.') && v.length >= 6;
};

const normalizeUyPhone = (rawDigits: string) => {
  const digits = rawDigits.replace(/\D/g, '').replace(/^0+/, '');
  if (!(digits.length === 8 || digits.length === 9)) return null;
  return `+598${digits}`;
};

// 🔥 mini-wrapper reutilizable: Input + rightNode (sin tocar tu componente Input)
function InputRow({
  label,
  error,
  children,
  rightNode,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
  rightNode?: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: SPACING.md }}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>{children}</View>
        {rightNode ? <View style={styles.rightNode}>{rightNode}</View> : null}
      </View>

      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const Register: React.FC<RegisterProps> = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const markTouched = (key: string) => setTouched((p) => ({ ...p, [key]: true }));
  const showError = (key: string) => submitted || !!touched[key];

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Ingresá tu nombre.';
    if (!apellido.trim()) e.apellido = 'Ingresá tu apellido.';
    if (!emailLooksOk(email)) e.email = 'Ingresá un email válido.';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres.';
    if (!normalizeUyPhone(telefono)) e.telefono = 'Teléfono UY: 8 o 9 dígitos.';
    return e;
  }, [nombre, apellido, email, password, telefono]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0 && !loading, [errors, loading]);

  const handleChange = (key: string, setter: (v: string) => void) => (v: string) => {
    setter(v);
    // opcional: mientras escribe, no muestres error si no está submitted
    if (!submitted) setTouched((p) => ({ ...p, [key]: false }));
  };

  const handleSubmit = useCallback(async () => {
    setAlertMsg(null);
    setOk(false);
    setSubmitted(true);

    if (!canSubmit) {
      setAlertMsg('Revisá los campos marcados.');
      setOk(false);
      return;
    }

    const telefonoCompleto = normalizeUyPhone(telefono);
    if (!telefonoCompleto) {
      setAlertMsg('Teléfono inválido.');
      setOk(false);
      return;
    }

    const payloadForApi = {
      email: email.trim().toLowerCase(),
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefonoCompleto,
    };

    try {
      setLoading(true);
      await register(payloadForApi);

      setOk(true);
      setAlertMsg('¡Cuenta creada con éxito!');

      setTimeout(() => navigation?.replace?.('Login'), 450);
    } catch (e: any) {
      setOk(false);
      setAlertMsg(e?.message ?? 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, nombre, apellido, email, password, telefono, navigation]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header compacto (como pantalla seria) */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/fixo-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Súmate a Fixo</Text>
            <Text style={styles.subtitle}>
              Creá tu cuenta de cliente para pedir servicios en minutos.
            </Text>
          </View>

          {alertMsg && (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.md }}
            />
          )}

          <InputRow label="Nombre" error={showError('nombre') ? errors.nombre : null}>
            <Input
              placeholder="Ej: Juan"
              value={nombre}
              onChangeText={handleChange('nombre', setNombre)}
              onBlur={() => markTouched('nombre')}
              returnKeyType="next"
              autoCapitalize="words"
              textContentType="givenName"
            />
          </InputRow>

          <InputRow label="Apellido" error={showError('apellido') ? errors.apellido : null}>
            <Input
              placeholder="Ej: Pérez"
              value={apellido}
              onChangeText={handleChange('apellido', setApellido)}
              onBlur={() => markTouched('apellido')}
              returnKeyType="next"
              autoCapitalize="words"
              textContentType="familyName"
            />
          </InputRow>

          <InputRow label="Correo electrónico" error={showError('email') ? errors.email : null}>
            <Input
              placeholder="tu@email.com"
              value={email}
              onChangeText={handleChange('email', setEmail)}
              onBlur={() => markTouched('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              textContentType="emailAddress"
            />
          </InputRow>

          <InputRow
            label="Contraseña"
            error={showError('password') ? errors.password : null}
            rightNode={
              <TouchableOpacity
                onPress={() => setShowPass((p) => !p)}
                activeOpacity={0.85}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            }
          >
            <Input
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={handleChange('password', setPassword)}
              onBlur={() => markTouched('password')}
              secureTextEntry={!showPass}
              returnKeyType="next"
              textContentType="newPassword"
            />
          </InputRow>

          <InputRow label="Teléfono" error={showError('telefono') ? errors.telefono : null}>
            <Input
              placeholder="99 123 456"
              value={telefono}
              onChangeText={handleChange('telefono', (t) => setTelefono(t.replace(/[^0-9]/g, '')))}
              onBlur={() => markTouched('telefono')}
              keyboardType="phone-pad"
              maxLength={9}
              prefixText="+598"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              textContentType="telephoneNumber"
            />
          </InputRow>

          <Text style={styles.helper}>
            Al crear tu cuenta aceptás nuestros términos y política de privacidad.
          </Text>
          <View style={{ height: 130 }} />
        </ScrollView>

        {/* Footer fijo (mismo patrón que AddService) */}
        <View style={styles.footer}>
          <Button
            title={loading ? 'Creando…' : 'Crear cuenta'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
            size="lg"
          />

          <Text style={styles.footerText}>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  logo: {
    width: 110,
    height: 86,
    marginBottom: SPACING.xs,
  },

  title: {
    ...TYPO.h2, // 👈 menos gigante: register no es landing page
    textAlign: 'center',
  },

  subtitle: {
    ...TYPO.subtitle,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },

  card: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },

  sectionTitle: {
    ...TYPO.h3,
    marginBottom: SPACING.sm,
  },

  label: {
    ...TYPO.label,
    marginBottom: SPACING.sm,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rightNode: {
    marginLeft: SPACING.sm,
  },

  eyeBtn: {
    width: 46,
    height: 46,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgScreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldError: {
    ...TYPO.caption,
    color: COLORS.danger,
    marginTop: 6,
  },

  helper: {
    ...TYPO.helper,
    marginTop: SPACING.md,
  },

  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },

  footerText: {
    ...TYPO.bodyMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  footerLink: {
    ...TYPO.link,
  },
});
