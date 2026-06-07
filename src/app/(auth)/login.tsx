import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';

import { useAuth } from '../../hooks/use-auth';
import { login, getGoogleAuthUrl, googleCallback } from '../../api/auth';
import { WebView } from 'react-native-webview';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: saveSession } = useAuth();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState('');

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
      const authUrlRes = await getGoogleAuthUrl();
      if (!authUrlRes || authUrlRes.error || !authUrlRes.url) {
        throw new Error(authUrlRes?.error || 'Gagal mengambil URL otentikasi Google dari backend.');
      }
      setGoogleAuthUrl(authUrlRes.url);
      setShowGoogleModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memulai login Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (url: string) => {
    setLoading(true);
    try {
      const hash = url.split('#')[1];
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

      const callbackRes = await googleCallback(access_token, refresh_token);
      if (callbackRes && !callbackRes.error && callbackRes.id_user) {
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
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data Google.');
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

      {/* Google Sign-In In-App WebView Modal */}
      <Modal
        visible={showGoogleModal}
        animationType="slide"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          {/* Custom Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 bg-black">
            <Text className="text-white text-lg font-bold font-inter">Google Sign-In</Text>
            <TouchableOpacity 
              onPress={() => setShowGoogleModal(false)}
              className="px-3 py-1 bg-white/10 rounded-md"
            >
              <Text className="text-white font-inter text-sm">Close</Text>
            </TouchableOpacity>
          </View>
          
          {/* Google Sign-In WebView */}
          <WebView
            userAgent={
              Platform.OS === 'ios'
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
                : 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            }
            source={{ uri: googleAuthUrl }}
            onNavigationStateChange={(navState) => {
              // Intercept redirect to the backend website login URL
              if (navState.url.includes('https://gradia-three.vercel.app/auth/login')) {
                // Immediately close modal before displaying the web UI
                setShowGoogleModal(false);
                // Handle callback tokens exchange
                handleGoogleCallback(navState.url);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator
                color="#9457FF"
                size="large"
                style={styles.loadingOverlay}
              />
            )}
          />
        </SafeAreaView>
      </Modal>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
