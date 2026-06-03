import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  isLoading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
}) => {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'destructive' && styles.destructiveButton,
    (disabled || isLoading) && styles.disabledButton,
  ];

  const textStyle = [
    styles.text,
    variant === 'secondary' && styles.secondaryText,
    variant === 'destructive' && styles.destructiveText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.textPrimary : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.icon,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructiveButton: {
    backgroundColor: colors.redBg,
    borderWidth: 1,
    borderColor: colors.red,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  destructiveText: {
    color: colors.red,
  },
});
