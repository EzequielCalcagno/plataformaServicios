import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface LoginProps {
  // Opcional: si usás React Navigation
  navigation?: any;
  onLogin?: (email: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = () => {
    if (onLogin) {
      onLogin(email, password);
    }
    // Acá después vas a llamar a tu API o navegar:
    // navigation?.navigate('Home');
  };

  const handleSignUpPress = () => {
    // navigation?.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.content}>
        {/* Logo + nombre */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/fixo-logo.png')} style={styles.logo} />
          <Text style={styles.logoText}>Fixo</Text>
        </View>

        {/* Títulos */}
        <Text style={styles.title}>Welcome to Fixo</Text>
        <Text style={styles.subtitle}>
          Find reliable home service technicians in Uruguay.
        </Text>

        {/* Inputs */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9BA4B5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9BA4B5"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Botón Login */}
        <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        {/* Link Sign Up */}
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUpPress}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;

const PRIMARY_BLUE = '#2294F2';
const LIGHT_INPUT = '#E8EDF2';
const TEXT_DARK = '#2E4766';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY_BLUE,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  input: {
    width: '100%',
    backgroundColor: LIGHT_INPUT,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT_DARK,
  },
  button: {
    width: '100%',
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 13,
    color: PRIMARY_BLUE,
    fontWeight: '500',
  },
});
