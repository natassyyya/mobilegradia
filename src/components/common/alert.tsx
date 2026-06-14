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
        return { bg: '#14532D', text: '#F0FDF4', border: '#22C55E' };
      case 'destructive':
        return { bg: '#7F1D1D', text: '#FEF2F2', border: '#EF4444' };
      case 'warning':
        return { bg: '#78350F', text: '#FEFCE8', border: '#EAB308' };
      default:
        return { bg: '#0C4A6E', text: '#F0F9FF', border: '#0EA5E9' };
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
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 8,
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
    color: '#E4E4E7',
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
