/**
 * Dashboard Screen — Mobile
 * Layout 100% identik dengan Web/src/pages/Dashboard/Layout/Mobile.jsx
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, FileText, MapPin, BookOpen } from 'lucide-react-native';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useAuth } from '../../../hooks/use-auth';
import { useWorkspace } from '../../../hooks/use-workspace';
import { useAlert } from '../../../hooks/use-alert';
import { getTasks } from '../../../api/tasksApi';
import { getCoursesToday } from '../../../api/coursesApi';

/* ─── helpers (sama persis dengan Badge di Web) ─────────── */
const getBadgeStyle = (priority: string) => {
  if (priority === 'High')   return { bg: 'rgba(239,68,68,0.15)',    text: '#F87171' };
  if (priority === 'Medium') return { bg: 'rgba(234,179,8,0.15)',    text: '#FFEB3B' };
  return                              { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80' }; // Low / default = Green
};

const sksDotColor = (sks: number) => {
  if (sks === 3) return '#EF4444'; // red (sama dengan web: bg-red)
  if (sks === 2) return '#EAB308'; // yellow
  return '#3B82F6';                // blue
};

/* ════════════════════════════════════════════════════════ */
export default function DashboardScreen() {
  const { user }              = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { showAlert }         = useAlert();
  const router                = useRouter();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses,    setCourses]    = useState<any[]>([]);
  const [tasks,      setTasks]      = useState<any[]>([]);

  /* ── jam & tanggal (update tiap detik) ── */
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [city, setCity] = useState('Loading...');
  const [day,  setDay]  = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now
        .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        .replace(':', ' : ');
      const formattedDate = now.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
      const hour = now.getHours();
      setDay(hour >= 6 && hour < 18);
      setTime(formattedTime);
      setDate(formattedDate);
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── kota via geolokasi / IP (sama seperti Mobile.jsx) ── */
  useEffect(() => {
    const getCityFromCoords = async (lat: number, lon: number) => {
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setCity(data.address?.city || data.address?.town || data.address?.village || data.address?.state || 'Gradia');
      } catch { setCity('Gradia'); }
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getCityFromCoords(pos.coords.latitude, pos.coords.longitude),
        async () => {
          try {
            const res  = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            setCity(data.city || data.region || 'Unknown');
          } catch { setCity('Unknown'); }
        }
      );
    } else {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => setCity(d.city || d.region || 'Unknown'))
        .catch(() => setCity('Unknown'));
    }
  }, []);

  /* ── fetch data ── */
  const toLocalYmd = (value: any) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-CA');
  };

  const fetchData = useCallback(async (showSpinner = true) => {
    if (!activeWorkspaceId) { setLoading(false); return; }
    if (showSpinner) setLoading(true);
    try {
      const [t, c] = await Promise.all([
        getTasks(activeWorkspaceId),
        getCoursesToday(activeWorkspaceId),
      ]);
      setTasks(t   ?? []);
      setCourses(c ?? []);
    } catch {
      showAlert({ title: 'Error', desc: 'Gagal memuat data dashboard.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWorkspaceId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );
  const onRefresh = () => { setRefreshing(true); fetchData(false); };

  /* ── stats (logika sama persis dengan Mobile.jsx) ── */
  const stats = useMemo(() => {
    const todayYmd   = toLocalYmd(new Date());
    const total      = tasks.length;
    const completed  = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In progress').length;
    const notStarted = tasks.filter(t =>
      t.status === 'Not started' || t.status === 'Pending' || t.status === 'Overdue'
    ).length;
    const addedToday = tasks.filter(t => toLocalYmd(t.created_at) === todayYmd).length;
    const dueToday   = tasks.filter(t => toLocalYmd(t.deadline)   === todayYmd);
    const completedPct = total > 0 ? Math.round((completed  / total) * 100) : 0;
    const inProgPct    = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const notStPct     = total > 0 ? Math.round((notStarted / total) * 100) : 0;
    return { total, completed, inProgress, notStarted, addedToday, dueToday, completedPct, inProgPct, notStPct };
  }, [tasks]);

  /* ── pie legend (sama seperti const bg di Mobile.jsx) ── */
  const legend = [
    { title: 'Completed',  color: '#673AB7' },
    { title: 'In Progress', color: '#341D5C' },
    { title: 'Pending',    color: '#D9CEED' },
  ];

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0, backgroundColor: '#000' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9457FF" />}
      >

         {/* ── HEADER (Welcome in, username) ── */}
        <View style={{ marginTop: 8, gap: 6 }}>
          <Text style={s.welcomeTitle}>
            Welcome in, <Text style={{ textTransform: 'capitalize' }}>{user?.username ?? 'User'}</Text>
          </Text>
          <Text style={s.welcomeSub}>Track your learning progress, courses and tasks for today</Text>
        </View>

        {/* ── BANNER ── */}
        {/* Web: bg-gradient-to-tl from-[#539db8] to-[#164a7b] (day) | from-[#272727] to-[#000] (night) */}
        <View style={s.bannerWrap}>
          <LinearGradient
            colors={day ? ['#164a7b', '#539db8'] : ['#000000', '#272727']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.banner}
          >
            {/* Sun circle — from-[#DFA62B] to-[#FFE478], top-right */}
            <LinearGradient
              colors={['#FFE478', '#DFA62B']}
              style={[s.circle, { width: 88, height: 88, right: -32, top: -32 }]}
            />
            {/* Blue/gray circles (siang: #50d0f4, malam: #656565) */}
            <View style={[s.circle, {
              width: 168, height: 168, left: -60, bottom: -72,
              backgroundColor: day ? 'rgba(80,208,244,0.22)' : 'rgba(101,101,101,0.22)',
            }]} />
            <View style={[s.circle, {
              width: 132, height: 132, right: -48, top: -48,
              backgroundColor: day ? 'rgba(80,208,244,0.67)' : 'rgba(101,101,101,0.67)',
            }]} />
            <View style={[s.circle, {
              width: 172, height: 172, right: -56, top: -52,
              backgroundColor: day ? 'rgba(80,208,244,0.39)' : 'rgba(101,101,101,0.39)',
            }]} />
            <View style={[s.circle, {
              width: 216, height: 216, right: -48, top: -48,
              backgroundColor: day ? 'rgba(80,208,244,0.13)' : 'rgba(101,101,101,0.13)',
            }]} />

            {/* Time + Date + City */}
            <View style={s.bannerContent}>
              <Text style={s.bannerTime}>{time || '00:00'}</Text>
              <View style={{ gap: 4 }}>
                <Text style={s.bannerDate}>{date}</Text>
                <Text style={s.bannerCity}>{city}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color="#9457FF" />
            <Text style={{ color: '#A3A3A3', marginTop: 12, fontFamily: 'Inter', fontSize: 14 }}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            {/* ── DUE TODAY + COURSES TODAY (flex col, gap-6) ── */}
            {/* Web: <div className="flex flex-col gap-6 md:flex-row md:gap-4"> */}
            <View style={{ gap: 24 }}>

              {/* DUE TODAY — Card: from-[#141414] to-[#070707], border-border/50, rounded-2xl */}
              <LinearGradient colors={['#141414', '#070707']} style={s.card}>
                <Text style={s.cardTitle}>Due Today</Text>
                <View style={{ gap: 12, maxHeight: 220 }}>
                  {stats.dueToday.length > 0 ? (
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                      <View style={{ gap: 12 }}>
                        {stats.dueToday.map((task, idx) => {
                          const b = getBadgeStyle(task.priority);
                          return (
                            <View key={task.id_task ?? idx} style={[s.taskRow, { alignItems: 'center' }]}>
                              {/* Left Side: Sleek circular FileText icon badge */}
                              <View style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                backgroundColor: 'rgba(148, 87, 255, 0.12)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(148, 87, 255, 0.2)',
                              }}>
                                <FileText size={18} color="#9457FF" />
                              </View>

                              {/* Right Side: Title + Course + Priority */}
                              <View style={{ flex: 1, gap: 2 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={[s.taskTitle, { flex: 1, marginRight: 8 }]} >
                                    {task.title}
                                  </Text>
                                  {/* Compact Priority Badge */}
                                  <View style={{
                                    backgroundColor: b.bg,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: b.text + '30',
                                  }}>
                                    <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 10, color: b.text }}>
                                      {task.priority ?? 'Normal'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={[s.taskCourse, { marginBottom: 0, marginTop: 8 }]} >
                                  {task.relatedCourse ?? 'No course'}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    /* Web: h-[100px] bg-background-secondary rounded-[12px] */
                    <View style={s.emptyBox}>
                      <Text style={s.emptyTxt}>No tasks due today.</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              {/* COURSES TODAY */}
              <LinearGradient colors={['#141414', '#070707']} style={s.card}>
                <Text style={s.cardTitle}>Courses Today</Text>
                {courses.length > 0 ? (
                  /* Web mobile: flex flex-col gap-3 (vertikal pada mobile) */
                  <View style={{ gap: 12 }}>
                    {courses.map((course, idx) => (
                      /* CourseCard: bg-background-secondary rounded-[8px] p-3 */
                      <View key={course.id_courses ?? idx} style={s.courseCard}>
                        {/* dot + time */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <View style={[s.dot, { backgroundColor: sksDotColor(course.sks) }]} />
                          <Text style={s.courseTime}>{course.start} - {course.end}</Text>
                        </View>
                        {/* title + alias */}
                        <Text style={s.courseName} numberOfLines={2}>
                          {course.name} <Text style={s.courseAlias}>({course.alias?.toUpperCase()})</Text>
                        </Text>
                        {/* room */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                          <MapPin size={14} color="#643EB2" />
                          <Text style={s.courseDetail} numberOfLines={1}>{course.room}</Text>
                        </View>
                        {/* lecturer */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <BookOpen size={14} color="#643EB2" />
                          <Text style={s.courseDetail} numberOfLines={1}>{course.lecturer}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyTxt}>No courses today.</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* ── TASK PROGRESS + TOTAL TASKS (flex col, gap-6) ── */}
            {/* Web: <div className="flex flex-col md:flex-row gap-6 md:gap-4"> */}
            <View style={{ gap: 24 }}>

              {/* TASK PROGRESS — Web: bg-gradient-to-l from-[#211832] to-[#000] rounded-2xl p-6 */}
              <LinearGradient
                colors={['#000000', '#211832']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.card, { gap: 0 }]}
              >
                <Text style={[s.cardTitle, { marginBottom: 16 }]}>Task Progress</Text>

                {/* Pie replacement: donut-style arc via stacked bar + centered pct */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  {/* Semicircle simulation using a layered bar */}
                  <View style={s.donutWrap}>
                    {/* Outer colored arc using progress bar */}
                    <View style={s.donutBar}>
                      {stats.total === 0 ? (
                        <View style={{ flex: 1, backgroundColor: '#27272a' }} />
                      ) : (
                        <>
                          {stats.completedPct > 0 && <View style={{ flex: stats.completedPct, backgroundColor: '#673AB7', borderRadius: 4 }} />}
                          {stats.inProgPct    > 0 && <View style={{ flex: stats.inProgPct,    backgroundColor: '#341D5C', borderRadius: 4 }} />}
                          {stats.notStPct     > 0 && <View style={{ flex: stats.notStPct,     backgroundColor: '#D9CEED', borderRadius: 4 }} />}
                        </>
                      )}
                    </View>
                    {/* Center label — like the pie center text in web */}
                    <View style={s.donutCenter}>
                      <Text style={s.donutPct}>{stats.completedPct}%</Text>
                      <Text style={s.donutSub}>Task completed</Text>
                    </View>
                  </View>
                </View>

                {/* Legend — Web: w-full flex justify-between */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                  {legend.map(item => (
                    <View key={item.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color }} />
                      <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Inter' }}>{item.title}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>

              {/* TOTAL TASKS — Web: bg-gradient-to-tl from-[#28073B] to-[#34146c] rounded-2xl p-5 flex flex-col justify-between */}
              <LinearGradient
                colors={['#28073B', '#34146c']}
                start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }}
                style={[s.card, { justifyContent: 'space-between', minHeight: 180 }]}
              >
                {/* header row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 20, color: 'white' }}>Total Tasks</Text>
                  {/* Web: Link to="/tasks" w-[32px] h-[32px] rounded-full bg-white */}
                  <TouchableOpacity
                    onPress={() => router.push('/tasks' as any)}
                    style={s.arrowBtn}
                  >
                    <ArrowUpRight size={20} color="#000" />
                  </TouchableOpacity>
                </View>
                {/* Web: text-[64px] font-semibold font-montserrat */}
                <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 64, color: 'white', lineHeight: 72, marginTop: 8 }}>
                  {stats.total}
                </Text>
                {/* Web: text-[#FFEB3B] */}
                <Text style={{ color: '#FFEB3B', fontFamily: 'Inter', fontSize: 14 }}>
                  {stats.addedToday} tasks added today
                </Text>
              </LinearGradient>
            </View>

            {/* ── TASK COUNTERS (Completed + Not Started) | (On Progress) ── */}
            {/* Web: flex flex-col md:flex-row md:gap-4 gap-6 w-full */}
            <View style={{ gap: 16 }}>
              {/* Left group: Tasks Completed + Tasks Not Started (side by side) */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <LinearGradient colors={['#141414', '#070707']} style={[s.card, { flex: 1 }]}>
                  <Text style={s.cardTitle}>Tasks Completed</Text>
                  <Text style={s.counterNum}>{stats.completed}</Text>
                </LinearGradient>
                <LinearGradient colors={['#141414', '#070707']} style={[s.card, { flex: 1 }]}>
                  <Text style={s.cardTitle}>Tasks Not Started</Text>
                  <Text style={s.counterNum}>{stats.notStarted}</Text>
                </LinearGradient>
              </View>
              {/* Right: Tasks On Progress (full width on mobile, 1/3 on md+) */}
              <LinearGradient colors={['#141414', '#070707']} style={s.card}>
                <Text style={s.cardTitle}>Tasks On Progress</Text>
                <Text style={s.counterNum}>{stats.inProgress}</Text>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/* ─── styles ────────────────────────────────────────────── */
const s = StyleSheet.create({
  /* header */
  welcomeTitle: { fontFamily: 'Montserrat-Bold', fontSize: 20, color: 'white' },
  welcomeSub:   { fontFamily: 'Inter', fontSize: 14, color: '#A3A3A3', lineHeight: 20 },

  /* banner */
  bannerWrap: { borderRadius: 16, overflow: 'hidden' },
  banner: {
    width: '100%', height: 160, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  circle: { position: 'absolute', borderRadius: 999 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 10, paddingHorizontal: 8 },
  bannerTime: {
    fontFamily: 'Montserrat-Bold', fontSize: 32, color: 'white',
    borderRightWidth: 1, borderRightColor: 'white', paddingRight: 12,
  },
  bannerDate: { fontFamily: 'Inter-SemiBold', color: 'white', fontSize: 14 },
  bannerCity: { fontFamily: 'Inter', color: 'white', fontSize: 13 },

  /* card — mirrors Web Card.jsx: from-[#141414] to-[#070707], border border-border/50, rounded-2xl, px-4 py-5, gap-6 */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(101,101,101,0.5)',
    padding: 20,
    gap: 16,
  },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: 'white' },

  /* due today */
  taskRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, backgroundColor: '#141414', borderRadius: 12,
  },
  taskTitle:  { fontFamily: 'Inter-SemiBold', color: 'white', fontSize: 14 },
  taskCourse: { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 12, marginBottom: 4 },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeTxt:   { fontFamily: 'Inter-SemiBold', fontSize: 11 },

  /* empty state */
  emptyBox: {
    height: 100, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#141414', borderRadius: 12,
  },
  emptyTxt: { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 14 },

  /* course card — bg-background-secondary rounded-[8px] p-3 */
  courseCard: { backgroundColor: '#141414', borderRadius: 8, padding: 12 },
  dot:        { width: 12, height: 12, borderRadius: 6 },
  courseTime:   { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 13 },
  courseName:   { fontFamily: 'Inter-SemiBold', color: 'white', fontSize: 14, lineHeight: 20 },
  courseAlias:  { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 12 },
  courseDetail: { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 12, flex: 1 },

  /* task progress donut replacement */
  donutWrap: { width: '100%', gap: 12 },
  donutBar:  { height: 14, flexDirection: 'row', borderRadius: 7, overflow: 'hidden', backgroundColor: '#27272a' },
  donutCenter: { alignItems: 'center', paddingTop: 8 },
  donutPct:    { fontFamily: 'Montserrat-Bold', fontSize: 32, color: 'white' },
  donutSub:    { fontFamily: 'Inter', fontSize: 13, color: '#9457FF', marginTop: 2 },

  /* total tasks */
  arrowBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'white', justifyContent: 'center', alignItems: 'center',
  },

  /* task counters */
  counterNum: { fontFamily: 'Montserrat-Bold', fontSize: 64, color: '#FFEB3B', lineHeight: 70 },
});
