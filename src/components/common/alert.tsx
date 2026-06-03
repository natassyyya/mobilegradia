import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

interface AlertProps {
  title: string;
  desc?: string;
  variant?: 'success' | 'destructive' | 'info' | 'warning';
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  desc,
  variant = 'info',
  onClose,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.greenBg, text: colors.green, border: colors.green };
      case 'destructive':
        return { bg: colors.redBg, text: colors.red, border: colors.red };
      case 'warning':
        return { bg: colors.yellowBg, text: colors.yellow, border: colors.yellow };
      default:
        return { bg: colors.cyanBg, text: colors.cyan, border: colors.cyan };
    }
  };

  const currentColors = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentColors.bg,
          borderColor: currentColors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: currentColors.text }]}>{title}</Text>
        {desc && <Text style={styles.desc}>{desc}</Text>}
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: currentColors.text }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
    color: '#D4D4D8',
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
