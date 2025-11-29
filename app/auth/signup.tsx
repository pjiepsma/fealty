import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { parseSupabaseError, logError } from '@/utils/errorHandling';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert(t('common.error'), t('auth.signup.errors.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.signup.errors.passwordTooShort'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.signup.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username);
      Alert.alert(
        t('auth.signup.success.title'),
        t('auth.signup.success.message'),
        [
          { text: t('auth.signup.success.ok'), onPress: () => router.replace('/auth/login') },
        ]
      );
    } catch (error: any) {
      logError('SignUp', error);
      const parsedError = parseSupabaseError(error, t);
      Alert.alert(parsedError.title, parsedError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.signup.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.signup.username')}
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.signup.email')}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.signup.password')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('auth.signup.creatingAccount') : t('auth.signup.signupButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>
            {t('auth.signup.hasAccount')} <Text style={styles.linkTextBold}>{t('auth.signup.login')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Use same styles as login
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
