// src/screens/Login.tsx
import React, { useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login } from '../api/auth';
type AppRole = 'professional' | 'client';

const mapRolFromId = (id_rol: number): AppRole => {
   return id_rol === 2 ? 'professional' : 'client';
};
interface LoginProps {
  navigation?: any;
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);




  const handleLoginPress = async () => {
    setAlertMsg(null);
    setOk(false);

    if (!email || !password) {
      setAlertMsg('Completá email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const { token, usuario } = await login(email.trim(), password);

      // 👉 acá usamos el id_rol que viene del backend
      const appRole: AppRole = mapRolFromId(usuario.id_rol);

      // guardar token, datos y rol para usarlos después
      await AsyncStorage.multiSet([
        ['@token', token],
        ['@user', JSON.stringify(usuario)],
        ['@role', appRole],
      ]);

      setOk(true);
      setAlertMsg('¡Inicio de sesión correcto!');

      // navegar a Profile con el rol correcto
      navigation?.replace('Profile', { role: appRole });
    } catch (err: any) {
      setOk(false);
      setAlertMsg(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };


  const handleSignUpPress = () => {
    navigation?.navigate("Register"); // ← corregido (antes llevaba a Profile)
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/fixo-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bienvenido a Fixo</Text>
          <Text style={styles.subtitle}>
            Encontrá técnicos de servicios para el hogar en Uruguay.
          </Text>

          {alertMsg ? (
            <Text style={[styles.alert, ok ? styles.alertOk : styles.alertErr]}>
              {alertMsg}
            </Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setSecure((s) => !s)}
              style={styles.toggle}
              accessibilityLabel="Mostrar u ocultar contraseña"
            >
              <Text style={styles.toggleText}>{secure ? "Mostrar" : "Ocultar"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLoginPress}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            ¿No tenés una cuenta?{" "}
            <Text style={styles.footerLink} onPress={handleSignUpPress}>
              Registrate
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

/* ===== Colores alineados al HTML ===== */
const COLORS = {
  bg: "#f7f9fc",
  text: "#1f2937",
  muted: "#6b7280",
  input: "#e9eef5",
  border: "#dbe3ef",
  primary: "#1d8cff",
  primary600: "#1876d9",
  ok: "#166534",
  okBg: "#dcfce7",
  okBd: "#bbf7d0",
  err: "#b91c1c",
  errBg: "#fee2e2",
  errBd: "#fecaca",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f9fc' },
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  logo: {
    width: 120,
    height: 48,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 6,
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 4,
    marginBottom: 6,
  },
  input: {
    width: "100%",
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
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  inputFlex: { flex: 1, marginBottom: 0 },
  toggle: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  toggleText: { color: COLORS.primary, fontWeight: "700" },
  button: {
    width: "100%",
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footer: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 14,
    color: COLORS.muted,
  },
  footerLink: { color: "#0f60e6", textDecorationLine: "underline" },
  alert: {
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertOk: { backgroundColor: COLORS.okBg, borderColor: COLORS.okBd },
  alertErr: { backgroundColor: COLORS.errBg, borderColor: COLORS.errBd },

  // color del texto (blanco/verde/rojo, elegí el que prefieras)
  alertText: { color: COLORS.text, fontSize: 14 },

});
