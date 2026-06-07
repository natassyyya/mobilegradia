import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';

export default function VerifyOtpScreen() {
  const router = useRouter();
  // Menangkap data yang dikirim dari halaman Register/Login
  const { 
    email = 'user@example.com', 
    expiredAt, 
    from = 'verification', 
    purpose = 'register' 
  } = useLocalSearchParams<{ email: string, expiredAt: string, from: string, purpose: string }>();

  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Jika expiredAt dari parameter kosong, kita buat dummy 5 menit dari sekarang
  const dummyExpire = new Date(new Date().getTime() + 5 * 60000).toISOString();
  const [localExpiredAt, setLocalExpiredAt] = useState(expiredAt || dummyExpire);

  // === ⏱️ HITUNG MUNDUR WAKTU OTP ===
  useEffect(() => {
    if (!localExpiredAt) return;

    const target = new Date(localExpiredAt).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [localExpiredAt]);

  // === 🚀 VERIFY LOGIC ===
  const handleVerify = async () => {
    setErrorMsg('');
    
    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Simulasi API Call
      setTimeout(() => {
        setLoading(false);
        if (from === 'login') {
          router.replace('/dashboard' as any);
        } else if (from === 'verification') {
          alert('Verification Success!');
          router.replace('/login' as any);
        } else {
          router.push('/reset-password' as any);
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg('An error occurred while verifying OTP.');
      setLoading(false);
    }
  };

  // === 🔁 RESEND LOGIC ===
  const handleResendCode = async () => {
    setResending(true);
    setErrorMsg('');

    try {
      // Simulasi API Resend
      setTimeout(() => {
        // Tambah waktu 5 menit dari sekarang
        const newExpire = new Date(new Date().getTime() + 5 * 60000).toISOString();
        setLocalExpiredAt(newExpire);
        setOtp('');
        setResending(false);
        alert('New code has been sent to your email!');
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to resend code. Please try again.');
      setResending(false);
    }
  };

  // === UI UNTUK KOTAK OTP ===
  const inputRef = useRef<TextInput>(null);
  const renderOtpBoxes = () => {
    return (
      <View className="flex-row justify-between w-full mt-2">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const digit = otp[index] || '';
          const isCurrentDigit = index === otp.length;
          const isLastDigitAndFilled = index === 5 && otp.length === 6;
          const isFocused = isCurrentDigit || isLastDigitAndFilled;

          return (
            <View
              key={index}
              style={{
                width: 45,
                height: 55,
                borderWidth: 1,
                borderColor: isFocused ? '#9457FF' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-xl font-bold font-inter">{digit}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Background Bubbles */}
      <View className="absolute inset-0 z-0 pointer-events-none bg-black">
        <Image
          source={require('../../../assets/images/login/bubble-1.png')}
          className="absolute top-0 right-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          className="w-full px-4"
        >
          {/* Top Section */}
          <View className="w-full mt-10">
            <View className="py-[22px] flex-row justify-center">
              <Text className="text-[36px] font-extrabold tracking-wider text-white font-genos">
                <Text className="text-[#9457FF]">GRA</Text>DIA
              </Text>
            </View>

            <View className="items-center mt-2">
              <Text className="font-bold text-[30px] text-white text-center font-montserrat">
                Verify Your Email Address
              </Text>
              <Text className="text-center text-[#A3A3A3] mt-3 px-6 text-sm leading-5 font-inter">
                Enter the 6-digit code sent to your email
              </Text>
              <Text className="text-center text-[#9457FF] mt-1 font-bold font-inter text-sm">
                {email}
              </Text>
            </View>
          </View>

          {/* Body Section */}
          <View
            style={styles.bodySection}
            className="bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10"
          >
            {/* Custom OTP Input Setup */}
            <View className="relative w-full">
              {renderOtpBoxes()}
              {/* Invisible Input on top of boxes to capture keyboard typing */}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(text) => {
                  // Hanya izinkan angka, max 6 digit
                  setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                }}
                keyboardType="numeric"
                maxLength={6}
                caretHidden
                autoFocus
                style={StyleSheet.absoluteFill}
                className="opacity-0 w-full h-full text-[1px]"
              />
            </View>

            <Text
              className={`text-sm mt-3 text-center font-inter ${
                errorMsg ? 'text-red-400 opacity-100' : 'opacity-0'
              }`}
              style={{ height: 20 }}
            >
              {errorMsg || ' '}
            </Text>

            <View className="w-full items-center mb-6">
              <Text className="text-[#A3A3A3] font-bold font-inter text-lg tracking-widest">
                {timeLeft || '--:--'}
              </Text>
            </View>

            {/* Bottom Actions */}
            <View className="flex-col gap-6">
              <View className="flex-row justify-center items-center">
                <Text className="text-sm text-[#A3A3A3] font-inter">
                  Didn't receive the code?{' '}
                </Text>
                <TouchableOpacity onPress={handleResendCode} disabled={resending}>
                  <Text className={`font-bold font-inter ${resending ? 'text-gray-500' : 'text-[#9457FF] underline'}`}>
                    {resending ? 'Resending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
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
                    {loading ? 'Verifying...' : 'Verify'}
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