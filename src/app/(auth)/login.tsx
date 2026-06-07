import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';

import { useAuth } from '../../hooks/use-auth';
import { login, getGoogleAuthUrl, googleCallback } from '../../api/auth';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: saveSession } = useAuth();

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && !res.error) {
        // Simpan sesi user ke context global
        const userData = res.user || res.data || {
          id_user: res.id_user || 1,
          username: res.username || email.split('@')[0],
          email: res.email || email,
        };
        await saveSession(userData);
        router.replace('/dashboard' as any);
      } else {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      // 1. Dapatkan url sign-in google dari backend
      const authUrlRes = await getGoogleAuthUrl();
      if (!authUrlRes || authUrlRes.error || !authUrlRes.url) {
        throw new Error(authUrlRes?.error || 'Gagal mengambil URL otentikasi Google dari backend.');
      }

      // 2. Tentukan redirectUrl yang dicocokkan di Supabase (sesuai setelan server.js backend)
      const redirectUrl = "https://gradia-three.vercel.app/auth/login";

      // 3. Buka browser session untuk Google Sign-In
      const result = await WebBrowser.openAuthSessionAsync(authUrlRes.url, redirectUrl);

      // 4. Periksa hasil redirect
      if (result.type === 'success' && result.url) {
        // Ambil parameter access_token dan refresh_token dari bagian hash URL (#access_token=...&refresh_token=...)
        const hash = result.url.split('#')[1];
        if (!hash) {
          throw new Error('Format respon otentikasi tidak valid.');
        }

        const params = hash.split('&').reduce((acc: any, item) => {
          const [key, val] = item.split('=');
          acc[key] = decodeURIComponent(val);
          return acc;
        }, {});

        const { access_token, refresh_token } = params;
        if (!access_token) {
          throw new Error('Access token tidak ditemukan.');
        }

        // 5. Kirim token ke backend callback.js untuk verifikasi & ambil data user dari database
        const callbackRes = await googleCallback(access_token, refresh_token);
        if (callbackRes && !callbackRes.error && callbackRes.id_user) {
          // 6. Simpan sesi user ke global context dan masuk ke dashboard
          const userData = {
            id_user: callbackRes.id_user,
            username: callbackRes.username || 'Google User',
            email: callbackRes.email || '',
          };
          await saveSession(userData);
          router.replace('/dashboard' as any);
        } else {
          throw new Error(callbackRes?.error || 'Gagal masuk menggunakan Google callback.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk dengan Google.');
    } finally {
      setLoading(false);
    }
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
                <Link href={"/(auth)/register" as any} asChild>
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
