import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';
import { useAuth } from '../../hooks/use-auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: performLogin } = useAuth();

  const handleLogin = () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill all fields.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        await performLogin({ id_user: 1, username: email.split('@')[0], email: email });
        setLoading(false);
        router.replace('/(app)/workspaces');
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed.');
        setLoading(false);
      }
    }, 1500);
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Background Bubbles from Web */}
      <View className="absolute inset-0 z-0 pointer-events-none bg-black">
        {/* Top Right Bubble */}
        <Image
          source={require('../../../assets/images/login/bubble-1.png')}
          className="absolute top-0 right-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
        {/* Bottom Left Bubble */}
        <Image
          source={require('../../../assets/images/login/bubble-2.png')}
          className="absolute bottom-0 left-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 z-10"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="w-full px-4"
        >
          {/* Top Section: Logo & Welcome */}
          <View className="w-full mt-10">
            {/* Logo - Font Genos */}
            <View className="py-[22px] flex-row justify-start">
              <Text className="text-[36px] font-extrabold tracking-wider text-white font-genos">
                <Text className="text-[#9457FF]">GRA</Text>DIA
              </Text>
            </View>

            {/* Welcome Text - Font Montserrat */}
            <View className="items-center mt-4">
              <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                Welcome Back
              </Text>
              {/* Description - Font Inter */}
              <Text className="text-center text-[#A3A3A3] mt-3 px-4 text-sm leading-5 font-inter">
                Gradia helps you organize, login, and turn your self-management into real results.
              </Text>
            </View>
          </View>

          {/* Body Section (Glass Card) */}
          <View
            style={styles.bodySection}
            className="flex-1 bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10 justify-between"
          >
            {/* Inputs & Actions */}
            <View className="flex-1">
              {/* Form Input Fields - Font Inter */}
              <View className="flex-col gap-5">
                {/* Email Field */}
                <View className="flex-col gap-2">
                  <Text className="text-white text-sm font-inter">Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your-email@mail.com"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                  />
                </View>

                {/* Password Field */}
                <View className="flex-col gap-2">
                  <Text className="text-white text-sm font-inter">Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry
                    autoCapitalize="none"
                    className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                  />
                </View>
              </View>

              {/* Error Message */}
              <Text
                className={`text-sm mt-3 font-inter ${
                  errorMsg ? 'text-red-400 opacity-100' : 'opacity-0'
                }`}
                style={{ height: 20 }}
              >
                {errorMsg || ' '}
              </Text>

              {/* Forgot Password Link - Aligned to the Right (items-end) */}
              <View className="w-full items-end mt-1 mb-6">
                <Link href="/(auth)/reset-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-sm text-[#A3A3A3] font-inter">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Or Divider */}
              <View className="flex-row items-center justify-center gap-3 mb-5">
                <View className="flex-1 h-[1px] bg-white/10" />
                <Text className="text-[#A3A3A3] text-sm font-inter">or</Text>
                <View className="flex-1 h-[1px] bg-white/10" />
              </View>

              {/* Google OAuth Login Button - Centered horizontally (self-center) & Low opacity border */}
              <View className="items-center justify-center w-full mb-5">
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../../assets/svgs/google.svg')}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Actions: Register & Login Button */}
            <View className="flex-col gap-4 mt-8">
              {/* Register Link */}
              <Text className="text-sm text-[#A3A3A3] font-inter">
                Don't have an account?{' '}
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text className="underline text-[#9457FF] font-bold font-inter">Register Here</Text>
                  </TouchableOpacity>
                </Link>
              </Text>

              {/* Login Button with Main Gradient, Tall Padding-Y (py-[18px]), and Center Aligned */}
              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#34146C', '#28073B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 8,
                    paddingVertical:8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading && (
                    <ActivityIndicator size="small" color="#FAFAFA" />
                  )}
                  <Text className="text-white text-base font-inter text-center">
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bodySection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
});
