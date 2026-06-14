import { Platform } from 'react-native';
import { supabase } from './supabase';

let isExpoGo = false;
let Notifications: any = null;

// Cek dan inisialisasi secara dinamis saat runtime
if (Platform.OS !== 'web') {
  try {
    // Coba import modul notifications
    Notifications = require('expo-notifications');
    
    // Jika berhasil (bukan di Expo Go SDK 53+), set behavior handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e: any) {
    // Jika diblokir karena dijalankan di Expo Go, tandai secara dinamis
    if (e.message && e.message.includes('removed from Expo Go')) {
      isExpoGo = true;
      console.log('[PushNotification] Deteksi: Berjalan di Expo Go (SDK 53+). Fitur remote push dinonaktifkan secara aman agar tidak crash.');
    } else {
      console.warn('[PushNotification] Gagal memuat expo-notifications:', e.message);
    }
  }
}

// Fungsi untuk mendaftarkan push token ke database users
export async function registerForPushNotificationsAsync(id_user: number) {
  // Jika di Web, Expo Go, atau modul gagal di-load, langsung skip tanpa crash
  if (Platform.OS === 'web' || isExpoGo || !Notifications) {
    if (isExpoGo) {
      console.log(
        '[PushNotification] Pendaftaran remote push notification dilewati karena berjalan di Expo Go. ' +
        'Gunakan Development Build atau build APK untuk mengaktifkannya.'
      );
    }
    return null;
  }

  try {
    const Device = require('expo-device');
    const Constants = require('expo-constants').default;

    // A. Cek izin notifikasi perangkat
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotification] Izin notifikasi ditolak oleh pengguna.');
      return null;
    }

    // B. Ambil projectId
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      Constants.easConfig?.projectId;

    // C. Ambil Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    
    const token = tokenData.data;
    console.log('[PushNotification] Expo Push Token berhasil didapatkan:', token);

    // D. Simpan ke database Supabase
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id_user', id_user);

    if (error) {
      console.error('[PushNotification] Gagal menyimpan token ke database:', error.message);
    } else {
      console.log('[PushNotification] Token berhasil disimpan ke database.');
    }

    return token;
  } catch (err: any) {
    console.error('[PushNotification] Terjadi kesalahan saat pendaftaran token:', err.message);
    return null;
  }
}
