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

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const c = useTheme();

  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = '이름을 입력해주세요';
    if (!email) e.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아닙니다';
    if (!password) e.password = '비밀번호를 입력해주세요';
    else if (password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '회원가입에 실패했습니다';
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
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: c.textPrimary }}>회원가입</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>단어장 앱에 오신 걸 환영합니다</Text>
        </View>

        <Input
          label="이름"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          placeholder="홍길동"
          autoCorrect={false}
          error={errors.name}
        />

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
          placeholder="8자 이상 입력"
          isPassword
          error={errors.password}
        />

        <Button title="회원가입" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ alignItems: 'center', marginTop: 20 }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 14 }}>
            이미 계정이 있으신가요? <Text style={{ color: '#6366f1', fontWeight: '600' }}>로그인</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
