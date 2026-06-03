import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  useSafeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  useSafeArea = true,
}) => {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Container style={[styles.inner, style]}>
        {children}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
