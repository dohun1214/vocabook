import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../types';
import Button from '../../components/Button';
import Input from '../../components/Input';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const c = useTheme();

  const login = useAuthStore((s) => s.login);

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아닙니다';
    if (!password) e.password = '비밀번호를 입력해주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '로그인에 실패했습니다';
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.card }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: c.textPrimary }}>단어장</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>영어 단어를 스마트하게 외우세요</Text>
        </View>

        <Input
          label="이메일"
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />

        <Input
          label="비밀번호"
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
          placeholder="비밀번호 입력"
          isPassword
          error={errors.password}
        />

        <Button title="로그인" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={{ alignItems: 'center', marginTop: 20 }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 14 }}>
            계정이 없으신가요? <Text style={{ color: '#6366f1', fontWeight: '600' }}>회원가입</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
