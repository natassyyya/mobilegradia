import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors } from '../../constants/colors';

interface LoaderProps {
  visible?: boolean;
  overlay?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ visible = true, overlay = false }) => {
  if (!visible) return null;

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.logo} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    padding: 24,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
