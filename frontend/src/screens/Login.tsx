import React, { useState } from "react";
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
  StatusBar,
} from "react-native";

interface LoginProps {
  navigation?: any;
  onLogin?: (email: string, password: string) => Promise<void> | void;
}

const Login: React.FC<LoginProps> = ({ navigation, onLogin }) => {
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
      setAlertMsg("Completá email y contraseña.");
      return;
    }
    try {
      setLoading(true);
      await onLogin?.(email, password);
      setOk(true);
      setAlertMsg("¡Inicio de sesión correcto!");
      // ✅ Si ya tenés Home en tu stack, habilitá esta línea:
      // navigation?.navigate("Home");
    } catch (e: any) {
      setAlertMsg(e?.message ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    // ✅ Navega a la pantalla Register definida en tu Stack
    navigation?.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* <StatusBar barStyle="dark-content" /> */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require("../../assets/images/fixo-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Títulos */}
          <Text style={styles.title}>Bienvenido a Fixo</Text>
          <Text style={styles.subtitle}>
            Encontrá técnicos de servicios para el hogar en Uruguay.
          </Text>

          {/* Alertas */}
          {alertMsg ? (
            <Text style={[styles.alert, ok ? styles.alertOk : styles.alertErr]}>
              {alertMsg}
            </Text>
          ) : null}

          {/* Email */}
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

          {/* Password + toggle */}
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

          {/* Botón */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLoginPress}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            ¿No tenés una cuenta?{" "}
            <Text style={styles.footerLink} onPress={() => navigation?.navigate('Register')}>
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
  safe: { flex: 1, backgroundColor: '#f7f9fc', },
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
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
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
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertOk: { color: COLORS.ok, backgroundColor: COLORS.okBg, borderColor: COLORS.okBd },
  alertErr: { color: COLORS.err, backgroundColor: COLORS.errBg, borderColor: COLORS.errBd },
});
