import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const c = useTheme();

  const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: { backgroundColor: '#6366f1' },
      text: { color: '#ffffff' },
    },
    secondary: {
      container: { backgroundColor: c.secondary },
      text: { color: c.secondaryText },
    },
    danger: {
      container: { backgroundColor: '#ef4444' },
      text: { color: '#ffffff' },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#6366f1' },
      text: { color: '#6366f1' },
    },
  };

  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled || loading ? 0.6 : 1,
        },
        vs.container,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' ? '#6366f1' : '#fff'} />
      ) : (
        <Text style={[{ fontSize: 16, fontWeight: '600' }, vs.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
