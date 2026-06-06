import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator 
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // === LOGIKA VALIDASI PASSWORD ===
  const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordValidationDismissed, setPasswordValidationDismissed] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const showPasswordValidation = !passwordValidationDismissed && (passwordFocusedOnce || passwordFocused);

  useEffect(() => {
    if (!isPasswordValid) {
      setPasswordValidationDismissed(false);
    }
  }, [isPasswordValid]);

  const handleRegister = async () => {
    setErrorMsg('');

    if (!email || !username || !password) {
      setErrorMsg('Please fill all fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Password does not meet the required criteria.');
      return;
    }

    setLoading(true);

    try {
      // Catatan: Di mobile app, pastikan URL API menggunakan alamat lengkap (contoh: https://gradia.com/api/auth) 
      // karena path relatif "/api/auth" hanya berfungsi di Web.
      /* const res = await fetch("https://YOUR-API-URL/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, action: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      */

      // Simulasi loading API
      setTimeout(() => {
        setLoading(false);
        // Setelah sukses register, arahkan ke halaman verifikasi OTP
        // router.push({ pathname: '/(auth)/verify-otp', params: { email: email } });
        alert("Pura-puranya sukses kirim OTP!");
      }, 1500);

    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      setErrorMsg(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Background Bubbles (Sama persis dengan Login) */}
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

            {/* Title & Subtitle */}
            <View className="items-center mt-4">
              <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                Let's Register
              </Text>
              <Text className="text-center text-[#A3A3A3] mt-3 px-4 text-sm leading-5 font-inter">
                Join Gradia and take control of your goals, time, and mindset — all in one app.
              </Text>
            </View>
          </View>

          {/* Body Section (Glass Card dari web) */}
          <View
            style={styles.bodySection}
            className="flex-1 bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10 justify-between"
          >
            <View className="flex-1">
              <View className="flex-col gap-5">
                
                {/* Email Field */}
                <View className="flex-col gap-2">
                  <Text className="text-white text-sm font-inter">Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="youremail@mail.com"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                  />
                </View>

                {/* Username Field */}
                <View className="flex-col gap-2">
                  <Text className="text-white text-sm font-inter">Username</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username"
                    placeholderTextColor="#A3A3A3"
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
                    onFocus={() => {
                      setPasswordFocused(true);
                      setPasswordFocusedOnce(true);
                    }}
                    onBlur={() => {
                      setPasswordFocused(false);
                      if (isPasswordValid) setPasswordValidationDismissed(true);
                    }}
                    className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                  />
                </View>

                {/* Password Rules */}
                {showPasswordValidation && (
                  <View className="flex-col gap-2 mt-1">
                    <Text className={`text-[13px] font-inter ${passwordRules.length ? 'text-[#4ADE80]' : 'text-[#A3A3A3]'}`}>
                      {passwordRules.length ? "✓" : "○"} At least 8 characters
                    </Text>
                    <Text className={`text-[13px] font-inter ${passwordRules.uppercase ? 'text-[#4ADE80]' : 'text-[#A3A3A3]'}`}>
                      {passwordRules.uppercase ? "✓" : "○"} At least one capital letter
                    </Text>
                    <Text className={`text-[13px] font-inter ${passwordRules.number ? 'text-[#4ADE80]' : 'text-[#A3A3A3]'}`}>
                      {passwordRules.number ? "✓" : "○"} At least one number
                    </Text>
                    <Text className={`text-[13px] font-inter ${passwordRules.special ? 'text-[#4ADE80]' : 'text-[#A3A3A3]'}`}>
                      {passwordRules.special ? "✓" : "○"} At least one special character
                    </Text>
                  </View>
                )}
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
            </View>

            {/* Bottom Actions: Login Link & Register Button */}
            <View className="flex-col gap-4 mt-6">
              <Text className="text-sm text-[#A3A3A3] font-inter">
                Already have an account?{' '}
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="underline text-[#9457FF] font-bold font-inter">Login Here</Text>
                  </TouchableOpacity>
                </Link>
              </Text>

              <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#34146C', '#28073B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 8,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row'
                  }}
                >
                  {loading && (
                    <ActivityIndicator size="small" color="#FAFAFA" style={{ marginRight: 8 }} />
                  )}
                  <Text className="text-white text-base font-inter text-center font-bold">
                    {loading ? 'Registering...' : 'Register'}
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

// === HYBRID STYLING UNTUK EFEK SHADOW ===
const styles = StyleSheet.create({
  bodySection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
});