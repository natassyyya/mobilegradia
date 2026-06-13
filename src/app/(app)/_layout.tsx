/**
 * (app) Layout — Bottom Tab Navigator with Custom Floating Tab Bar
 *
 * Navigasi utama setelah login & pilih workspace.
 * Menyajikan 5 Menu Utama di Tab Bar (untuk touch target maksimal):
 *   - Calendar
 *   - Tasks
 *   - Dashboard (Di tengah, lebih besar, gradien menonjol)
 *   - Courses
 *   - Menu (Membuka Bottom Sheet Drawer berisi Presences, Switch Workspace, Logout)
 *
 * Desain tab bar mengacu pada Modern Floating, Rounded, Glassmorphism Dock.
 */
import React, { useState } from 'react';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { 
  View, StyleSheet, Platform, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, Text, TouchableWithoutFeedback 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/use-auth';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Menu as MenuIcon,
  X,
} from 'lucide-react-native';

/* ─── CUSTOM FLOATING TAB BAR ───────────────────────────────── */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Route saat ini yang sedang aktif
  const activeRouteName = state.routes[state.index].name;

  // Sembunyikan tab bar di halaman workspaces
  if (activeRouteName === 'workspaces/index') {
    return null;
  }

  const navigateTo = (routeName: string) => {
    const route = state.routes.find((r: any) => r.name === routeName);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate({ name: routeName, merge: true });
    }
  };

  const handleMenuAction = (action: () => void) => {
    setMenuOpen(false);
    setShowLogoutConfirm(false);
    action();
  };

  const closeDrawer = () => {
    setMenuOpen(false);
    setShowLogoutConfirm(false);
  };

  // Apakah tab More/Menu sedang aktif secara visual (misal pas buka presences)
  const isMenuTabActive = activeRouteName === 'presences/index' || menuOpen;

  return (
    <>
      <View style={styles.floatingContainer}>
        {/* 1. Calendar */}
        <TouchableOpacity
          onPress={() => navigateTo('calendar/index')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <CalendarDays
            size={22}
            color={activeRouteName === 'calendar/index' ? '#9457FF' : '#A3A3A3'}
          />
          {activeRouteName === 'calendar/index' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* 2. Tasks */}
        <TouchableOpacity
          onPress={() => navigateTo('tasks/index')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <ClipboardList
            size={22}
            color={activeRouteName === 'tasks/index' ? '#9457FF' : '#A3A3A3'}
          />
          {activeRouteName === 'tasks/index' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* 3. Dashboard (Tengah / Menonjol) */}
        <TouchableOpacity
          onPress={() => navigateTo('dashboard/index')}
          style={styles.centerContainer}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={activeRouteName === 'dashboard/index' ? ['#9457FF', '#6025C9'] : ['#2A2A2A', '#1E1E1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.centerGradient,
              activeRouteName === 'dashboard/index' && styles.centerGradientActive,
            ]}
          >
            <LayoutDashboard size={26} color="#FAFAFA" />
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. Courses */}
        <TouchableOpacity
          onPress={() => navigateTo('courses/index')}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <BookOpen
            size={22}
            color={activeRouteName === 'courses/index' ? '#9457FF' : '#A3A3A3'}
          />
          {activeRouteName === 'courses/index' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {/* 5. More / Menu */}
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <MenuIcon
            size={22}
            color={isMenuTabActive ? '#9457FF' : '#A3A3A3'}
          />
          {isMenuTabActive && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Modern Bottom Sheet Menu Drawer (Menempel Dibawah) */}
      <Modal
        visible={menuOpen}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeDrawer}
      >
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Header Row */}
                <View style={styles.drawerHeader}>
                  <Text style={styles.logoText}>
                    <Text style={{ color: '#9457FF' }}>GRA</Text>DIA
                  </Text>
                  
                  <TouchableOpacity onPress={closeDrawer}>
                    <X size={24} color="#FAFAFA" />
                  </TouchableOpacity>
                </View>

                {/* Thin Divider Line */}
                <View style={styles.dividerLine} />

                {!showLogoutConfirm ? (
                  /* Bullet Menu Items */
                  <View style={styles.bulletList}>
                    {/* Presences */}
                    <TouchableOpacity
                      onPress={() => handleMenuAction(() => navigateTo('presences/index'))}
                      activeOpacity={0.7}
                      style={styles.bulletItem}
                    >
                      <Text 
                        style={[
                          styles.bulletText, 
                          activeRouteName === 'presences/index' ? styles.bulletTextInactive : styles.bulletTextActive
                        ]}
                      >
                        •  Presences
                      </Text>
                    </TouchableOpacity>

                    {/* Switch Workspace */}
                    <TouchableOpacity
                      onPress={() => handleMenuAction(() => router.replace('/workspaces' as any))}
                      activeOpacity={0.7}
                      style={styles.bulletItem}
                    >
                      <Text style={[styles.bulletText, styles.bulletTextAction]}>
                        •  Switch Workspace
                      </Text>
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity
                      onPress={() => setShowLogoutConfirm(true)}
                      activeOpacity={0.7}
                      style={styles.bulletItem}
                    >
                      <Text style={[styles.bulletText, styles.bulletTextAction]}>
                        •  Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Inline Logout Confirmation Screen */
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ fontSize: 24, fontFamily: 'Montserrat-Bold', fontWeight: 'bold', color: '#FAFAFA', marginBottom: 12 }}>
                      •  Confirm Logout
                    </Text>
                    
                    <Text style={{ fontSize: 15, color: '#A3A3A3', fontFamily: 'Inter', lineHeight: 22, marginBottom: 32 }}>
                      Are you sure you want to log out from Gradia?
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {/* Cancel Button */}
                      <TouchableOpacity
                        onPress={() => setShowLogoutConfirm(false)}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          height: 48,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Text style={{ color: '#FAFAFA', fontWeight: '600', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      {/* Confirm Logout Button */}
                      <TouchableOpacity
                        onPress={async () => {
                          setMenuOpen(false);
                          setShowLogoutConfirm(false);
                          try {
                            await logout();
                            router.replace('/login' as any);
                          } catch (e) {
                            console.warn('Logout failed:', e);
                          }
                        }}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          height: 48,
                          backgroundColor: '#FB2C36',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: '#FB2C36',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 4,
                        }}
                      >
                        <Text style={{ color: '#FAFAFA', fontWeight: '600', fontSize: 16, fontFamily: 'Inter-SemiBold' }}>
                          Logout
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#9457FF" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ── Dashboard ── */}
      <Tabs.Screen name="dashboard/index" options={{ title: 'Dashboard' }} />

      {/* ── Calendar ── */}
      <Tabs.Screen name="calendar/index" options={{ title: 'Calendar' }} />

      {/* ── Tasks ── */}
      <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />

      {/* ── Courses ── */}
      <Tabs.Screen name="courses/index" options={{ title: 'Courses' }} />

      {/* ── Presences ── */}
      <Tabs.Screen name="presences/index" options={{ title: 'Presences' }} />

      {/* ── Workspaces (Hidden) ── */}
      <Tabs.Screen name="workspaces/index" options={{ href: null, title: 'Workspaces' }} />

    </Tabs>
  );
}

/* ─── STYLES ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20, 20, 20, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  tabButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9457FF',
  },
  centerContainer: {
    top: -16,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  centerGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9457FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  centerGradientActive: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  // Modal Drawer Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    width: '100%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 4,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Genos-Bold',
    fontWeight: 'bold',
    color: '#FAFAFA',
    letterSpacing: 1,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  bulletList: {
    flexDirection: 'column',
    gap: 24,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletText: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
  },
  bulletTextActive: {
    color: '#FAFAFA',
  },
  bulletTextInactive: {
    color: '#555555',
  },
  bulletTextAction: {
    color: '#FAFAFA',
  },
});
