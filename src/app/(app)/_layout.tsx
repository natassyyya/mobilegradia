/**
 * (app) Layout — Bottom Tab Navigator
 *
 * Navigasi utama setelah login & pilih workspace.
 * 5 tab: Dashboard, Calendar, Tasks, Courses, Presences
 * (+ workspaces sebagai screen Stack terpisah)
 *
 * Desain tab bar mengacu pada Web Navbar.jsx:
 *   navItemsSUm  → Dashboard, Calendar
 *   navItemsMain → Tasks, Courses, Presences
 * Warna aktif  : #9457FF  (logo/brand Gradia)
 * Warna inaktif: #656565
 * Background   : #000000  (hitam pekat seperti Navbar web)
 */
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BookOpen,
  UserCheck,
} from 'lucide-react-native';

/* ─── icon wrapper ─────────────────────────────────────────── */
type TabIconProps = {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string | any;
  focused: boolean;
};

function TabIcon({ Icon, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={22} color={color as string} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: '#9457FF',    // warna logo Gradia
        tabBarInactiveTintColor: '#656565',  // warna border web
      }}
    >
      {/* ── navItemsSUm[0]: Dashboard ── */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── navItemsSUm[1]: Calendar ── */}
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={CalendarDays} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── navItemsMain[0]: My tasks ── */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={ClipboardList} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── navItemsMain[1]: Courses ── */}
      <Tabs.Screen
        name="courses/index"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={BookOpen} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── navItemsMain[2]: Presences ── */}
      <Tabs.Screen
        name="presences"
        options={{
          title: 'Presences',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={UserCheck} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── Workspaces — hidden dari tab bar (navItemsSide: "Back") ── */}
      <Tabs.Screen
        name="workspaces/index"
        options={{
          href: null,     // tidak tampil di tab bar
          title: 'Workspaces',
        }}
      />

      {/* ── Screens lama (workspace singular, dll) — hide dari tabs ── */}
      <Tabs.Screen name="workspace" options={{ href: null }} />
    </Tabs>
  );
}

/* ─── styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',          // Web Navbar: bg-black
    borderTopWidth: 1,
    borderTopColor: 'rgba(101,101,101,0.3)', // border-border/50
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 0,                        // hapus shadow Android
    shadowOpacity: 0,                    // hapus shadow iOS
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    marginTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(148,87,255,0.15)',  // #9457FF dengan opacity 15%
  },
});
