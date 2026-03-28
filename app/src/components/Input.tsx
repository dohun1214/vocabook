import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function Input({ label, error, containerStyle, isPassword, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const c = useTheme();

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: c.textSecondary, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          style={[
            {
              flex: 1,
              borderWidth: 1.5,
              borderColor: error ? '#ef4444' : c.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: c.textPrimary,
              backgroundColor: c.inputBg,
            },
            props.style,
          ]}
          placeholderTextColor={c.placeholder}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 14 }}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
