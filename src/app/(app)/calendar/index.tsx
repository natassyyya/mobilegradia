/**
 * Calendar Screen — Mobile
 * Layout 100% identik dengan:
 *   Web/src/pages/Calendar/Layout/Mobile.jsx
 *   Web/src/pages/Calendar/components/Calendar.jsx
 *   Web/src/pages/Calendar/components/Card.jsx
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useWorkspace } from '../../../hooks/use-workspace';
import { getTasks } from '../../../api/tasksApi';

/* ─── Badge colour map (persis seperti Calendar.jsx) ──────── */
const BADGE_COLORS: Record<string, string> = {
  Blue:   '#60a5fa',
  Green:  '#4ade80',
  Purple: '#c084fc',
  Orange: '#fb923c',
  Yellow: '#fde047',
  Red:    '#f87171',
  Cyan:   '#22d3ee',
  Pink:   '#f472b6',
  Gray:   '#d4d4d8',
};

const getBadgeColor = (task: any): string => {
  const st = task.status?.toLowerCase() ?? '';
  const pr = task.priority?.toLowerCase() ?? '';
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  if (['completed', 'done', 'selesai'].includes(st)) return BADGE_COLORS.Green;

  if (pr === 'high') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Purple;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Pink;
    if (isOverdue) return BADGE_COLORS.Red;
  }
  if (pr === 'medium') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Blue;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Yellow;
    if (isOverdue) return BADGE_COLORS.Orange;
  }
  if (pr === 'low') {
    if (['in progress', 'ongoing', 'progress'].includes(st)) return BADGE_COLORS.Cyan;
    if (['not started', 'todo', 'backlog'].includes(st))     return BADGE_COLORS.Gray;
  }
  return BADGE_COLORS.Gray;
};

/* badge style (persis Card.jsx priority / status) */
const priorityBadge = (priority: string) => {
  if (priority === 'High')   return { bg: 'rgba(248,113,113,0.15)', text: '#F87171' };
  if (priority === 'Medium') return { bg: 'rgba(253,224,71,0.15)',  text: '#FDE047' };
  return                              { bg: 'rgba(34,211,238,0.15)', text: '#22D3EE' };
};
const statusBadge = (status: string) => {
  const s = status?.toLowerCase() ?? '';
  if (s === 'not started') return { bg: 'rgba(212,212,216,0.15)',  text: '#D4D4D8' };
  if (s === 'in progress') return { bg: 'rgba(34,211,238,0.15)',   text: '#22D3EE' };
  if (s === 'completed')   return { bg: 'rgba(74,222,128,0.15)',   text: '#4ADE80' };
  return                           { bg: 'rgba(248,113,113,0.15)', text: '#F87171' };
};

/* month / day names */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const SHORT_MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* ════════════════════════════════════════════════════════════ */
export default function CalendarScreen() {
  const { activeWorkspaceId } = useWorkspace();

  const [tasks,        setTasks]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  /* fetch tasks */
  useEffect(() => {
    const fetch_ = async () => {
      if (!activeWorkspaceId) { setLoading(false); return; }
      try {
        const data = await getTasks(activeWorkspaceId);
        const colored = (data ?? []).map((t: any) => ({ ...t, color: getBadgeColor(t) }));
        setTasks(colored);
      } catch (e) {
        console.error('[Calendar] fetch tasks:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [activeWorkspaceId]);

  /* calendar math */
  const { daysInMonth, startingDayOfWeek, year, month } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay   = new Date(y, m, 1);
    const lastDay    = new Date(y, m + 1, 0);
    const daysInMonth       = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0
    return { daysInMonth, startingDayOfWeek, year: y, month: m };
  }, [currentDate]);

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const today            = new Date();

  const getTasksForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.deadline?.split('T')[0] === dateStr);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
    setSelectedDate(1);
  };

  /* tasks untuk tanggal dipilih + filter search */
  const selectedDayTasks = getTasksForDate(selectedDate).filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* trailing cells */
  const trailingCount = (7 - ((startingDayOfWeek + daysInMonth) % 7)) % 7;

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0, backgroundColor: '#000' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER (persis Mobile.jsx) ── */}
        {/* Web: flex flex-col gap-2 */}
        <View style={{ gap: 6, marginTop: 8 }}>
          {/* Web: flex justify-between */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 4 }}>
              {/* Web: font-montserrat text-[20px] font-semibold */}
              <Text style={s.pageTitle}>Calendar</Text>
              {/* Web: text-foreground-secondary */}
              <Text style={s.pageSub}>Stay on track every day with your smart calendar.</Text>
            </View>
          </View>
        </View>

        {/* ── SEARCH (Mobile.jsx: di bawah header pada mobile) ── */}
        <View style={s.searchWrap}>
          <Search size={16} color="#A3A3A3" style={{ marginRight: 8 }} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search task title..."
            placeholderTextColor="#6B7280"
            style={s.searchInput}
          />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#9457FF" />
            <Text style={{ color: '#A3A3A3', marginTop: 12, fontFamily: 'Inter', fontSize: 14 }}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            {/* ── CALENDAR GRID ── */}
            {/* Web: flex gap-4 bg-black w-full border border-border/50 rounded-[12px] */}
            <View style={s.calendarBox}>

              {/* Calendar Header: today mini card + month/year label */}
              {/* Web: flex items-center justify-between mb-5 px-4 */}
              <View style={s.calHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Web: w-16 h-16 border border-border/50 flex flex-col gap-1 */}
                  <View style={s.todayBox}>
                    <Text style={s.todayMonth}>{SHORT_MONTH[today.getMonth()]}</Text>
                    <View style={s.todayDayBg}>
                      <Text style={s.todayDay}>{today.getDate()}</Text>
                    </View>
                  </View>
                  {/* Web: flex flex-col justify-between py-3 */}
                  <View style={{ gap: 6 }}>
                    {/* Web: text-[#FFEB3B] font-medium */}
                    <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
                    {/* Web: text-zinc-500 */}
                    <Text style={s.monthRange}>
                      1 {MONTH_NAMES[month]} – {daysInMonth} {MONTH_NAMES[month]}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Day of week headers */}
              {/* Web: grid grid-cols-7 */}
              <View style={s.dowRow}>
                {DAY_LABELS.map(d => (
                  <View key={d} style={s.dowCell}>
                    <Text style={s.dowText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              {/* Web: grid grid-cols-7 */}
              <View style={s.gridWrap}>
                {/* Previous month filler */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => {
                  const d = prevMonthLastDay - startingDayOfWeek + i + 1;
                  return (
                    <View key={`prev-${i}`} style={[s.dayCell, s.dayCellFaded]}>
                      <Text style={s.dayNumFaded}>{d}</Text>
                    </View>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d         = i + 1;
                  const dayTasks  = getTasksForDate(d).filter(t =>
                    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isSelected = d === selectedDate;

                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setSelectedDate(d)}
                      style={[
                        s.dayCell,
                        isSelected && s.dayCellSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Day number — highlight yellow if today */}
                      <View style={isToday ? s.todayNumBg : undefined}>
                        <Text style={[
                          s.dayNum,
                          isToday    && s.dayNumToday,
                          isSelected && !isToday && s.dayNumSelected,
                          !isToday && !isSelected && s.dayNumNormal,
                        ]}>
                          {d}
                        </Text>
                      </View>

                      {/* Task dots (max 3) */}
                      {dayTasks.length > 0 && (
                        <View style={s.dotsRow}>
                          {dayTasks.slice(0, 3).map((task, idx) => (
                            <View
                              key={idx}
                              style={[s.taskDot, { backgroundColor: task.color }]}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Next month filler */}
                {Array.from({ length: trailingCount }).map((_, i) => (
                  <View key={`next-${i}`} style={[s.dayCell, s.dayCellFaded]}>
                    <Text style={s.dayNumFaded}>{i + 1}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── NAVIGATION prev / next ── */}
            {/* Web: w-full flex justify-between mt-2 */}
            <View style={s.navRow}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={s.navBtn}>
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
              <Text style={s.navLabel}>{MONTH_NAMES[month]} {year}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={s.navBtn}>
                <ChevronRight size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* ── EVENTS FOR SELECTED DATE ── */}
            {/* Web: flex flex-col gap-3 mb-6 */}
            <View style={{ gap: 16 }}>
              {/* Title */}
              <View style={{ gap: 4 }}>
                {/* Web: font-semibold text-[20px] */}
                <Text style={s.eventTitle}>
                  Event for {selectedDate}. {MONTH_NAMES[month]}
                </Text>
                {/* Web: text-[14px] text-foreground-secondary */}
                <Text style={s.eventSub}>
                  {selectedDayTasks.length > 0 ? "Don't miss scheduled events" : 'No events for this date'}
                </Text>
              </View>

              {/* Cards grid — grid-cols-1 on mobile */}
              {selectedDayTasks.length > 0 ? (
                <View style={{ gap: 16 }}>
                  {selectedDayTasks.map((task, idx) => {
                    const pBadge = priorityBadge(task.priority);
                    const sBadge = statusBadge(task.status);
                    const dateStr = task.deadline?.split('T')[0] ?? '';
                    const timeStr = task.deadline
                      ? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      /* Card: bg-gradient-to-t from-[#141414] to-[#070707] rounded-[8px] px-2 py-5 flex flex-col gap-5 border border-border/50 */
                      <LinearGradient key={idx} colors={['#141414', '#070707']} style={s.eventCard}>
                        {/* dot + date,time */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[s.colorDot, { backgroundColor: task.color }]} />
                          <Text style={s.cardDateTime}>{dateStr}, {timeStr}</Text>
                        </View>
                        {/* title + course + desc */}
                        <View style={{ gap: 4, width: '90%' }}>
                          <Text style={s.cardTitle}>{task.title}</Text>
                          <Text style={s.cardCourse} numberOfLines={1}>{task.course?.name ?? 'No Course'}</Text>
                          <Text style={s.cardDesc}   numberOfLines={1}>{task.description ?? 'No Description'}</Text>
                        </View>
                        {/* badges: priority + status */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <View style={[s.badge, { backgroundColor: pBadge.bg }]}>
                            <Text style={[s.badgeTxt, { color: pBadge.text }]}>{task.priority}</Text>
                          </View>
                          <View style={[s.badge, { backgroundColor: sBadge.bg }]}>
                            <Text style={[s.badgeTxt, { color: sBadge.text }]}>{task.status}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    );
                  })}
                </View>
              ) : (
                /* Web: bg-linear-to-t from-[#141414] to-[#070707] rounded-xl px-2 py-5 h-[178px] items-center justify-center text-foreground-secondary */
                <LinearGradient colors={['#141414', '#070707']} style={s.emptyCard}>
                  <Text style={s.emptyTxt}>No tasks scheduled for today</Text>
                </LinearGradient>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/* ─── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  pageTitle: { fontFamily: 'Montserrat-Bold', fontSize: 20, color: 'white' },
  pageSub:   { fontFamily: 'Inter', fontSize: 14, color: '#A3A3A3' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  searchInput: { flex: 1, color: 'white', fontFamily: 'Inter', fontSize: 14 },

  /* calendar box */
  calendarBox: {
    borderWidth: 1, borderColor: 'rgba(101,101,101,0.5)',
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#000',
  },
  calHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  todayBox: {
    width: 56, height: 56, borderWidth: 1, borderColor: 'rgba(101,101,101,0.5)',
    borderRadius: 8, alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, paddingHorizontal: 4,
  },
  todayMonth: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#A3A3A3' },
  todayDayBg: { backgroundColor: '#643EB2', borderRadius: 6, width: '100%', alignItems: 'center', paddingVertical: 2 },
  todayDay:   { fontFamily: 'Inter-SemiBold', fontSize: 16, color: 'white' },
  monthLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#FFEB3B' },
  monthRange: { fontFamily: 'Inter', fontSize: 12, color: '#71717a' },

  /* days-of-week header row */
  dowRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(101,101,101,0.3)' },
  dowCell: {
    flex: 1, borderWidth: 0.5, borderColor: 'rgba(101,101,101,0.3)',
    paddingVertical: 8, alignItems: 'center',
  },
  dowText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: 'white' },

  /* grid */
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 60,
    borderWidth: 0.5,
    borderColor: 'rgba(101,101,101,0.3)',
    padding: 4,
    flexDirection: 'column',
  },
  dayCellFaded:   { backgroundColor: '#242424' },
  dayCellSelected: { borderColor: 'rgba(255,255,255,0.4)', borderWidth: 1 },
  dayNum:         { fontFamily: 'Inter-SemiBold', fontSize: 12 },
  dayNumNormal:   { color: '#A3A3A3' },
  dayNumFaded:    { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#555' },
  dayNumToday:    { color: '#000' },
  dayNumSelected: { color: 'white' },
  todayNumBg:     {
    backgroundColor: '#FFEB3B', borderRadius: 10, paddingHorizontal: 3,
    alignSelf: 'flex-start',
  },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  taskDot: {
    width: 14, height: 5, borderRadius: 3,
    borderWidth: 0.5, borderColor: 'rgba(101,101,101,0.5)',
  },

  /* navigation */
  navRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn:  { padding: 8 },
  navLabel: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: 'white' },

  /* events section */
  eventTitle: { fontFamily: 'Inter-SemiBold', fontSize: 20, color: 'white' },
  eventSub:   { fontFamily: 'Inter', fontSize: 14, color: '#A3A3A3' },

  /* event card (= Web Calendar Card.jsx) */
  eventCard: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 20,
    gap: 20, borderWidth: 1, borderColor: 'rgba(101,101,101,0.5)',
  },
  colorDot:    { width: 12, height: 12, borderRadius: 6 },
  cardDateTime:{ fontFamily: 'Inter', fontSize: 14, color: '#A3A3A3' },
  cardTitle:   { fontFamily: 'Inter-SemiBold', fontSize: 15, color: 'white', marginBottom: 2 },
  cardCourse:  { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#A3A3A3' },
  cardDesc:    { fontFamily: 'Inter', fontSize: 13, color: '#A3A3A3' },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeTxt:    { fontFamily: 'Inter-SemiBold', fontSize: 11 },

  /* empty */
  emptyCard: {
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 20,
    height: 178, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(101,101,101,0.5)',
  },
  emptyTxt: { fontFamily: 'Inter', color: '#A3A3A3', fontSize: 14 },
});
