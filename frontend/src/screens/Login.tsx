// src/screens/Login.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useSession } from '../context/SessionContext';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';

import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';
import { AppModal } from '../components/AppModal';

const emailLooksOk = (s: string) => {
  const v = s.trim().toLowerCase();
  return v.includes('@') && v.includes('.') && v.length >= 6;
};

// 🔥 igual que en Register (podés moverlo a /components/FormField)
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

const Login = ({ navigation }: any) => {
  // ❌ SACÁ ESTO en prod. Si querés, condicioná por __DEV__.
  const [email, setEmail] = useState(__DEV__ ? 'ezequielcalcagno@gmail.com' : '');
  const [password, setPassword] = useState(__DEV__ ? '123456789' : '');

  const [showPass, setShowPass] = useState(false);

  const [showAccountsAppleModal, setShowAccountsAppleModal] = useState(false);
  const [showAccountsGoogleModal, setShowAccountsGoogleModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const { login } = useSession();

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!emailLooksOk(email)) e.email = 'Ingresá un email válido.';
    if (!password) e.password = 'Ingresá tu contraseña.';
    return e;
  }, [email, password]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0 && !loading, [errors, loading]);

  const handleLoginPress = useCallback(async () => {
    setAlertMsg(null);
    setOk(false);

    if (!canSubmit) {
      setAlertMsg('Revisá los campos marcados.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setOk(false);
      setAlertMsg(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, email, password, login, navigation]);

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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/fixo-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Qué bueno verte de nuevo</Text>
            <Text style={styles.subtitle}>
              Entrá para contratar servicios o gestionar tus trabajos.
            </Text>
          </View>

          {alertMsg && (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.md }}
            />
          )}

          <InputRow label="Correo electrónico" error={errors.email}>
            <Input
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              textContentType="emailAddress"
            />
          </InputRow>

          <InputRow label="Contraseña" error={errors.password}>
            <Input
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLoginPress}
              textContentType="password"
            />
          </InputRow>

          {/* Opcional: “Olvidé mi contraseña” */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.navigate?.('ForgotPassword')}
            style={{ marginTop: SPACING.md }}
          >
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Divider + Social adentro del card (mismo bloque visual) */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>o</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialBtnsContainer}>
            <Button
              title="Continuá con Apple"
              onPress={() => setShowAccountsAppleModal(true)}
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
              onPress={() => setShowAccountsGoogleModal(true)}
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

          <View style={{ height: 130 }} />
        </ScrollView>

        <AppModal
          visible={showAccountsAppleModal}
          title="Cuentas de Apple"
          text="Aquí podrás iniciar sesión con tu cuenta de Apple próximamente."
          onClose={() => setShowAccountsAppleModal(false)}
        />

        <AppModal
          visible={showAccountsGoogleModal}
          title="Cuentas de Google"
          text="Aquí podrás iniciar sesión con tu cuenta de Google próximamente."
          onClose={() => setShowAccountsGoogleModal(false)}
        />

        {/* Footer fijo */}
        <View style={styles.footer}>
          <Button
            title={loading ? 'Ingresando…' : 'Continuar'}
            onPress={handleLoginPress}
            disabled={!canSubmit}
            variant="primary"
            size="lg"
          />

          <Text style={styles.footerText}>
            ¿Todavía no tenés cuenta?{' '}
            <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
              Crear una
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default Login;

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
    ...TYPO.h2,
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

  forgot: {
    ...TYPO.link,
    textDecorationLine: 'none',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bgDivider,
  },

  or: {
    marginHorizontal: 10,
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: TYPO.caption.fontFamily,
  },

  socialBtnsContainer: {
    gap: 12,
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
