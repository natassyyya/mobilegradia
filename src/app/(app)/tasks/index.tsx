import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useWorkspace } from '../../../hooks/use-workspace';
import { useAlert } from '../../../hooks/use-alert';
import { getTasks, createTask, updateTask, deleteTask } from '../../../api/tasksApi';
import { getCourses } from '../../../api/coursesApi';

/* === HELPER WARNA === */
const badgeCls = (type: string) => {
  switch (type) {
    case 'High':
    case 'Overdue':
      return { bg: '#EF444420', text: '#F87171', dot: '#F87171' };
    case 'Medium':
      return { bg: '#EAB30825', text: '#FDE047', dot: '#EAB308' };
    case 'Low':
    case 'Not started':
      return { bg: '#6B728020', text: '#D4D4D8', dot: '#6B7280' };
    case 'In progress':
      return { bg: '#06B6D420', text: '#22D3EE', dot: '#06B6D4' };
    case 'Completed':
      return { bg: '#22C55E20', text: '#4ADE80', dot: '#22C55E' };
    default:
      return { bg: '#6B728020', text: '#D4D4D8', dot: '#6B7280' };
  }
};

const formatDate = (isoStr: string) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Days from next month
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
};

export default function TasksScreen() {
  const { activeWorkspaceId } = useWorkspace();
  const { showAlert } = useAlert();

  const [openCategories, setOpenCategories] = useState<string[]>(['Not started', 'In progress', 'Overdue']);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Dropdown States
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Description input Ref
  const descRef = useRef<any>(null);

  // Description dynamic height state (initial 3 lines)
  const [descHeight, setDescHeight] = useState<number | undefined>(undefined);

  // Time Picker State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState('23');
  const [tempMinute, setTempMinute] = useState('59');

  const openTimePicker = () => {
    const parts = (form.deadlineTime || '23:59').split(':');
    setTempHour(parts[0] || '23');
    setTempMinute(parts[1] || '59');
    setTimePickerVisible(true);
  };

  const confirmTimeSelection = () => {
    const formattedTime = `${tempHour}:${tempMinute}`;
    setForm(prev => ({ ...prev, deadlineTime: formattedTime }));
    setTimePickerVisible(false);
  };

  // Date Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDay, setTempDay] = useState('14');
  const [tempMonth, setTempMonth] = useState(5); // 0-indexed (June is 5)
  const [tempYear, setTempYear] = useState(2026);
  const [calendarView, setCalendarView] = useState<'calendar' | 'month' | 'year'>('calendar');

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setTempMonth(prev => {
      if (prev === 0) {
        setTempYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const nextMonth = () => {
    setTempMonth(prev => {
      if (prev === 11) {
        setTempYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const openDatePicker = () => {
    let initialDay = '14';
    let initialMonth = 5;
    let initialYear = 2026;

    if (form.deadlineDate && form.deadlineDate.includes('-')) {
      const parts = form.deadlineDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          initialYear = y;
          initialMonth = m - 1; // 0-indexed
          initialDay = d.toString().padStart(2, '0');
        }
      }
    } else {
      const today = new Date();
      initialYear = today.getFullYear();
      initialMonth = today.getMonth();
      initialDay = today.getDate().toString().padStart(2, '0');
    }

    setTempYear(initialYear);
    setTempMonth(initialMonth);
    setTempDay(initialDay);
    setCalendarView('calendar');
    setDatePickerVisible(true);
  };

  const confirmDateSelection = () => {
    const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
    let finalDay = parseInt(tempDay);
    if (finalDay > daysInMonth) {
      finalDay = daysInMonth;
    }
    const formattedDay = finalDay.toString().padStart(2, '0');
    const formattedMonth = (tempMonth + 1).toString().padStart(2, '0');
    const formattedDate = `${tempYear}-${formattedMonth}-${formattedDay}`;

    setForm(prev => ({ ...prev, deadlineDate: formattedDate }));
    setDatePickerVisible(false);
  };

  // Adjust day out-of-bounds automatically if year/month changes
  useEffect(() => {
    if (datePickerVisible) {
      const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
      const currentDayInt = parseInt(tempDay);
      if (currentDayInt > daysInMonth) {
        setTempDay(daysInMonth.toString().padStart(2, '0'));
      }
    }
  }, [tempYear, tempMonth, datePickerVisible]);

  const [form, setForm] = useState({
    title: '', 
    description: '', 
    priority: 'High', 
    status: 'Not started', 
    id_course: null as number | null,
    deadlineDate: '', 
    deadlineTime: '23:59'
  });

  const fetchTasks = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getTasks(activeWorkspaceId);
      setTasks(data || []);
    } catch (err) {
      console.error('[TasksScreen] Error loading tasks:', err);
      showAlert({
        title: 'Error',
        desc: 'Failed to load tasks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, showAlert]);

  const fetchCourses = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const data = await getCourses(activeWorkspaceId);
      setCourses(data || []);
    } catch (err) {
      console.error('[TasksScreen] Error loading courses:', err);
    }
  }, [activeWorkspaceId]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchCourses();
    }, [fetchTasks, fetchCourses])
  );

  const groupedTasks = useMemo(() => ({
    'Not started': tasks.filter(t => t.status === 'Not started'),
    'In progress': tasks.filter(t => t.status === 'In progress'),
    'Completed': tasks.filter(t => t.status === 'Completed'),
    'Overdue': tasks.filter(t => t.status === 'Overdue'),
  }), [tasks]);

  const sortedCoursesForDropdown = useMemo(() => {
    return [...courses].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [courses]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleOpenDrawer = (taskItem: any = null) => {
    setCourseDropdownOpen(false);
    setStatusDropdownOpen(false);
    setDescHeight(undefined);
    if (taskItem) {
      setSelectedTask(taskItem);
      let dDate = '';
      let dTime = '23:59';
      if (taskItem.deadline) {
        try {
          const d = new Date(taskItem.deadline);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const date = String(d.getDate()).padStart(2, '0');
            dDate = `${year}-${month}-${date}`;
            dTime = d.toTimeString().split(' ')[0].slice(0, 5);
          }
        } catch (e) {}
      }
      setForm({
        title: taskItem.title || '', 
        description: taskItem.description || '', 
        priority: taskItem.priority || 'High', 
        status: taskItem.status || 'Not started', 
        id_course: taskItem.id_course || (courses[0]?.id_courses || null),
        deadlineDate: dDate,
        deadlineTime: dTime
      });
    } else {
      setSelectedTask(null);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const date = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowStr = `${year}-${month}-${date}`;

      setForm({ 
        title: '', 
        description: '', 
        priority: 'High', 
        status: 'Not started', 
        id_course: courses[0]?.id_courses || null,
        deadlineDate: tomorrowStr,
        deadlineTime: '23:59'
      });
    }
    setModalVisible(true);
    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (descRef.current) {
          descRef.current.style.height = 'auto';
          descRef.current.style.height = `${Math.max(72, descRef.current.scrollHeight)}px`;
        }
      }, 50);
    }
  };

  const handleSave = async () => {
    if (!activeWorkspaceId) {
      showAlert({ title: 'Error', desc: 'No active workspace selected. Please select a workspace first.', variant: 'destructive' });
      return;
    }
    if (!form.title.trim()) {
      showAlert({ title: 'Validation', desc: 'Task name is required.', variant: 'destructive' });
      return;
    }

    let courseId = form.id_course;
    if (!courseId && courses.length > 0) {
      courseId = courses[0].id_courses;
    }

    if (!courseId) {
      showAlert({ title: 'Validation', desc: 'Please select a course. If you do not have any courses, please add one first in the Courses tab.', variant: 'destructive' });
      return;
    }

    if (!form.deadlineDate.trim()) {
      showAlert({ title: 'Validation', desc: 'Deadline date is required.', variant: 'destructive' });
      return;
    }

    setActionLoading(true);

    let deadlineIso = '';
    try {
      const d = new Date(`${form.deadlineDate}T${form.deadlineTime}:00`);
      if (isNaN(d.getTime())) {
        showAlert({ title: 'Validation', desc: 'Invalid date or time format. Use YYYY-MM-DD and HH:MM.', variant: 'destructive' });
        setActionLoading(false);
        return;
      }
      deadlineIso = d.toISOString();
    } catch (e) {
      showAlert({ title: 'Validation', desc: 'Invalid deadline date or time format.', variant: 'destructive' });
      setActionLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      id_course: courseId,
      deadline: deadlineIso,
      id_workspace: activeWorkspaceId,
    };

    try {
      if (selectedTask) {
        await updateTask(selectedTask.id_task, payload);
        showAlert({ title: 'Success', desc: 'Task updated successfully.', variant: 'success' });
      } else {
        await createTask(payload);
        showAlert({ title: 'Success', desc: 'Task created successfully.', variant: 'success' });
      }
      setModalVisible(false);
      fetchTasks();
    } catch (err: any) {
      console.error('[TasksScreen] Save error:', err);
      showAlert({
        title: 'Error',
        desc: err.message || 'Failed to save task.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await deleteTask(selectedTask.id_task);
      showAlert({ title: 'Deleted', desc: 'Task removed successfully.', variant: 'success' });
      setModalVisible(false);
      fetchTasks();
    } catch (err: any) {
      console.error('[TasksScreen] Delete error:', err);
      showAlert({
        title: 'Error',
        desc: err.message || 'Failed to delete task.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0, backgroundColor: '#000000' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}>
          
          {/* Header Section */}
          <View style={{ width: '100%', marginBottom: 24, gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Montserrat-Bold' }}>Tasks</Text>
            <Text style={{ color: '#A3A3A3', fontSize: 14, lineHeight: 20 }}>Keep track of your tasks all in one place.</Text>
          </View>

          {/* === STATS GRID === */}
          <View style={{ width: '100%', borderWidth: 1, borderColor: '#2c2c2c', borderRadius: 12, padding: 16, flexDirection: 'row', marginBottom: 32, backgroundColor: '#000000' }}>
            
            {/* Kolom Kiri */}
            <View style={{ flex: 1, paddingRight: 16, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' }}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#A3A3A3', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Total tasks</Text>
                <Text style={{ color: '#FDE047', fontSize: 40, fontWeight: 'bold', lineHeight: 44 }}>{tasks.length}</Text>
              </View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#A3A3A3', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>In progress tasks</Text>
                <Text style={{ color: '#FDE047', fontSize: 40, fontWeight: 'bold', lineHeight: 44 }}>{groupedTasks['In progress'].length}</Text>
              </View>
              <View>
                <Text style={{ color: '#A3A3A3', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Overdue tasks</Text>
                <Text style={{ color: '#FDE047', fontSize: 40, fontWeight: 'bold', lineHeight: 44 }}>{groupedTasks['Overdue'].length}</Text>
              </View>
            </View>

            {/* Kolom Kanan */}
            <View style={{ flex: 1, paddingLeft: 16, justifyContent: 'flex-start' }}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#A3A3A3', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Not started tasks</Text>
                <Text style={{ color: '#FDE047', fontSize: 40, fontWeight: 'bold', lineHeight: 44 }}>{groupedTasks['Not started'].length}</Text>
              </View>
              <View>
                <Text style={{ color: '#A3A3A3', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Completed tasks</Text>
                <Text style={{ color: '#FDE047', fontSize: 40, fontWeight: 'bold', lineHeight: 44 }}>{groupedTasks['Completed'].length}</Text>
              </View>
            </View>
            
          </View>

          {/* === OVERVIEW HEADER === */}
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.5)', paddingBottom: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Overview</Text>
            
            <TouchableOpacity onPress={() => handleOpenDrawer()} activeOpacity={0.8}>
              <LinearGradient 
                colors={['#34146C', '#28073B']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}} 
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="add" size={16} color="#FAFAFA" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14, marginLeft: 8 }}>Add tasks</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* === CATEGORIES (Accordion List) === */}
          <View style={{ width: '100%', backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 24 }}>
            {Object.entries(groupedTasks).map(([status, list]) => {
              const isOpen = openCategories.includes(status);
              
              let iconName: any = 'file-text';
              let iconBg = '#6B728020';
              let iconColor = '#D4D4D8';

              if (status === 'In progress') { iconName = 'loader'; iconBg = '#06B6D420'; iconColor = '#22D3EE'; }
              if (status === 'Completed') { iconName = 'check-square'; iconBg = '#22C55E20'; iconColor = '#4ADE80'; }
              if (status === 'Overdue') { iconName = 'alert-triangle'; iconBg = '#EF444420'; iconColor = '#F87171'; }

              return (
                <View key={status} style={{ width: '100%', marginBottom: 8 }}>
                  
                  {/* Category Header */}
                  <TouchableOpacity 
                    onPress={() => toggleCategory(status)}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16, backgroundColor: '#000000', borderRadius: 8, borderColor: 'rgba(44,44,44,0.5)', borderWidth: 1 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 26, height: 26, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg, marginRight: 12 }}>
                        <Feather name={iconName} size={14} color={iconColor} />
                      </View>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{status}</Text>
                    </View>
                    <View style={{ width: 26, height: 26, borderRadius: 4, backgroundColor: 'rgba(107,114,128,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={isOpen ? 'caret-up' : 'caret-down'} size={14} color="#A3A3A3" />
                    </View>
                  </TouchableOpacity>

                  {/* Category Content */}
                  {isOpen && (
                    <View style={{ marginTop: 12, paddingHorizontal: 4, width: '100%' }}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#9457FF" style={{ paddingVertical: 16 }} />
                      ) : list.length > 0 ? (
                        list.map((task) => {
                          const pColor = badgeCls(task.priority);
                          const sColor = badgeCls(task.status);
                          
                          return (
                            <TouchableOpacity 
                              key={task.id_task}
                              onPress={() => handleOpenDrawer(task)}
                              activeOpacity={0.8}
                              style={{ backgroundColor: '#000000', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sColor.dot, marginRight: 8 }} />
                                <Text style={{ color: '#A3A3A3', fontSize: 14 }}>
                                  {formatDate(task.deadline)}, {formatTime(task.deadline)}
                                </Text>
                              </View>

                              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{task.title}</Text>
                              <Text style={{ color: '#A3A3A3', fontWeight: '600', fontSize: 14, marginBottom: 8 }} numberOfLines={1}>{task.course?.name || '-'}</Text>
                              <Text style={{ color: '#A3A3A3', fontSize: 14, marginBottom: 20 }} numberOfLines={1}>
                                {task.description || '-'}
                              </Text>

                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ backgroundColor: pColor.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                                  <Text style={{ color: pColor.text, fontSize: 12, fontWeight: '600' }}>{task.priority}</Text>
                                </View>
                                <View style={{ backgroundColor: sColor.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                                  <Text style={{ color: sColor.text, fontSize: 12, fontWeight: '600' }}>{task.status}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={{ color: '#A3A3A3', fontSize: 13, fontStyle: 'italic', paddingVertical: 8, paddingHorizontal: 8 }}>No tasks available.</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Slide-up Details & Edit Modal Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end z-[99]">
          <View className="w-full h-[88%] bg-[#111] rounded-t-[24px] border-t border-white/10 p-5 flex-col justify-between">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-white/5">
              <Text className="font-semibold text-white text-lg font-montserrat">
                {selectedTask ? 'Task Details' : 'Add Task'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                <Feather name="x" size={18} color="#FAFAFA" />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Fields */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 15 }}
              className="flex-1 my-2"
              nestedScrollEnabled={true}
            >
              <KeyboardAvoidingView behavior="padding" className="flex-col gap-4">
                {/* Task Name Textarea */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Task Name *
                  </Text>
                  <TextInput
                    placeholder="Enter your task name here"
                    placeholderTextColor="#666"
                    value={form.title}
                    onChangeText={(t) => setForm(prev => ({ ...prev, title: t }))}
                    multiline
                    numberOfLines={2}
                    className="w-full bg-[#1b1b1b] rounded-lg p-3 text-white font-inter text-base"
                    style={{ minHeight: 60, textAlignVertical: 'top', outlineStyle: 'none' } as any}
                  />
                </View>

                {/* Course Dropdown */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Course *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCourseDropdownOpen(!courseDropdownOpen);
                      setStatusDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-between bg-[#1b1b1b] rounded-lg px-3 py-3"
                  >
                    <View className="flex-row items-center">
                      <Feather name="book" size={16} color="#A3A3A3" className="mr-3" />
                      <Text className="text-white font-inter text-sm">
                        {courses.find(c => c.id_courses === form.id_course)?.name || 'Select a course'}
                      </Text>
                    </View>
                    <Ionicons name={courseDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#A3A3A3" />
                  </TouchableOpacity>

                  {courseDropdownOpen && (
                    <View className="bg-[#141414] border border-white/10 rounded-lg mt-1 overflow-hidden max-h-[160px] z-[100]">
                      <ScrollView nestedScrollEnabled={true}>
                        {sortedCoursesForDropdown.map((c) => {
                          const isSelected = form.id_course === c.id_courses;
                          return (
                            <TouchableOpacity
                              key={c.id_courses}
                              onPress={() => {
                                setForm(prev => ({ ...prev, id_course: c.id_courses }));
                                setCourseDropdownOpen(false);
                              }}
                              className={`px-4 py-3 border-b border-white/5 flex-row justify-between items-center ${
                                isSelected ? 'bg-[#9457FF]/10' : 'bg-transparent'
                              }`}
                            >
                              <Text className={`font-inter text-sm ${isSelected ? 'text-white font-semibold' : 'text-[#A3A3A3]'}`}>
                                {c.name}
                              </Text>
                              {isSelected && <Ionicons name="checkmark" size={16} color="#9457FF" />}
                            </TouchableOpacity>
                          );
                        })}
                        {sortedCoursesForDropdown.length === 0 && (
                          <View className="px-4 py-3">
                            <Text className="text-[#6B7280] font-inter text-sm italic">No courses available.</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Description Input */}
                <View className="flex-row items-start bg-[#1b1b1b] rounded-lg px-3 py-2.5">
                  <Feather name="file-text" size={16} color="#A3A3A3" className="mr-3 mt-1" />
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter mb-1">Description</Text>
                    <TextInput 
                      ref={descRef}
                      placeholder="Add a short description"
                      placeholderTextColor="#666"
                      value={form.description}
                      onChangeText={(t) => {
                        setForm(prev => ({ ...prev, description: t }));
                        if (Platform.OS === 'web' && descRef.current) {
                          descRef.current.style.height = 'auto';
                          descRef.current.style.height = `${Math.max(72, descRef.current.scrollHeight)}px`;
                        }
                      }}
                      multiline={true}
                      onContentSizeChange={(e) => {
                        if (Platform.OS !== 'web') {
                          setDescHeight(e.nativeEvent.contentSize.height);
                        }
                      }}
                      className="text-white font-inter text-sm p-0 m-0"
                      style={{ 
                        minHeight: 72,
                        height: Platform.OS === 'web' ? undefined : descHeight, 
                        outlineStyle: 'none', 
                        textAlignVertical: 'top'
                      } as any}
                    />
                  </View>
                </View>

                {/* Deadline Date and Time Inputs */}
                <View className="flex-row gap-3">
                  {/* Date Picker Button */}
                  <TouchableOpacity
                    onPress={openDatePicker}
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center bg-[#1b1b1b] rounded-lg px-3 py-2"
                  >
                    <Feather name="calendar" size={16} color="#A3A3A3" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Deadline Date *</Text>
                      <Text className="text-white font-inter text-sm mt-0.5">
                        {form.deadlineDate || 'Select Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={openTimePicker}
                    activeOpacity={0.8}
                    className="flex-1 flex-row items-center bg-[#1b1b1b] rounded-lg px-3 py-2"
                  >
                    <Feather name="clock" size={16} color="#A3A3A3" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Time *</Text>
                      <Text className="text-white font-inter text-sm mt-0.5">
                        {form.deadlineTime}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Priority Selector */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Priority
                  </Text>
                  <View className="flex-row gap-3">
                    {['High', 'Medium', 'Low'].map((p) => {
                      const isSelected = form.priority === p;
                      let highlightBg = 'bg-transparent';
                      let highlightBorder = 'border-transparent';
                      let activeText = 'text-[#A3A3A3]';

                      if (isSelected) {
                        activeText = 'text-white';
                        if (p === 'High') {
                          highlightBg = 'bg-[#F87171]/20';
                          highlightBorder = 'border-[#F87171]';
                        } else if (p === 'Medium') {
                          highlightBg = 'bg-[#FDE047]/20';
                          highlightBorder = 'border-[#FDE047]';
                        } else {
                          highlightBg = 'bg-white/10';
                          highlightBorder = 'border-white/20';
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setForm(prev => ({ ...prev, priority: p }))}
                          activeOpacity={0.8}
                          className={`flex-1 items-center justify-center py-2.5 rounded-lg border ${highlightBg} ${highlightBorder}`}
                        >
                          <Text className={`font-bold font-inter text-sm ${activeText}`}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Status Selection */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Status *
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStatusDropdownOpen(!statusDropdownOpen);
                      setCourseDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-between bg-[#1b1b1b] rounded-lg px-3 py-3"
                  >
                    <View className="flex-row items-center">
                      <Feather name="loader" size={16} color="#A3A3A3" className="mr-3" />
                      <View className="flex-row items-center">
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: badgeCls(form.status).dot, marginRight: 8 }} />
                        <Text className="text-white font-inter text-sm">
                          {form.status}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name={statusDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#A3A3A3" />
                  </TouchableOpacity>

                  {statusDropdownOpen && (
                    <View className="bg-[#141414] border border-white/10 rounded-lg mt-1 overflow-hidden z-[100]">
                      {['Not started', 'In progress', 'Completed', 'Overdue'].map((s) => {
                        const isSelected = form.status === s;
                        const sColor = badgeCls(s);
                        return (
                          <TouchableOpacity
                            key={s}
                            onPress={() => {
                              setForm(prev => ({ ...prev, status: s }));
                              setStatusDropdownOpen(false);
                            }}
                            className={`px-4 py-3 border-b border-white/5 flex-row justify-between items-center ${
                              isSelected ? 'bg-white/5' : 'bg-transparent'
                            }`}
                          >
                            <View className="flex-row items-center">
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sColor.dot, marginRight: 8 }} />
                              <Text className={`font-inter text-sm ${isSelected ? 'text-white font-semibold' : 'text-[#A3A3A3]'}`}>
                                {s}
                              </Text>
                            </View>
                            {isSelected && <Ionicons name="checkmark" size={16} color="#FAFAFA" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </ScrollView>

            {/* Modal Footer Controls */}
            <View className="flex-row items-center justify-between border-t border-white/5 pt-4 mt-1 gap-3">
              {selectedTask && (
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={actionLoading}
                  className="bg-[#EF4444]/20 border border-[#EF4444]/30 w-12 h-12 items-center justify-center rounded-lg"
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Feather name="trash-2" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={actionLoading}
                className="flex-1 rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={['#34146C', '#28073B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: actionLoading ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FAFAFA" />
                  ) : (
                    <Text className="text-white font-semibold font-inter text-base">
                      {selectedTask ? 'Save Changes' : 'Add Task'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={timePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <View style={{ width: '85%', maxWidth: 320, backgroundColor: '#141414', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
            {/* Modal Title */}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', fontFamily: 'Montserrat-Bold', marginBottom: 15, textAlign: 'center' }}>
              Select Deadline Time
            </Text>

            {/* Selection Column Headers */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 }}>
              <Text style={{ color: '#A3A3A3', fontSize: 12, fontWeight: '600' }}>Hour</Text>
              <Text style={{ color: '#A3A3A3', fontSize: 12, fontWeight: '600' }}>Minute</Text>
            </View>

            {/* Columns Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', height: 160, marginBottom: 20 }}>
              {/* Hour ScrollView */}
              <ScrollView style={{ flex: 1, marginRight: 5 }} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 24 }, (_, i) => {
                  const hr = i.toString().padStart(2, '0');
                  const isSelected = tempHour === hr;
                  return (
                    <TouchableOpacity
                      key={hr}
                      onPress={() => setTempHour(hr)}
                      style={{
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#9457FF' : 'transparent',
                        borderRadius: 6,
                        marginVertical: 2
                      }}
                    >
                      <Text style={{ color: isSelected ? 'white' : '#A3A3A3', fontWeight: isSelected ? 'bold' : 'normal' }}>
                        {hr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.05)', height: '100%' }} />

              {/* Minute ScrollView */}
              <ScrollView style={{ flex: 1, marginLeft: 5 }} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 60 }, (_, i) => {
                  const min = i.toString().padStart(2, '0');
                  const isSelected = tempMinute === min;
                  return (
                    <TouchableOpacity
                      key={min}
                      onPress={() => setTempMinute(min)}
                      style={{
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#9457FF' : 'transparent',
                        borderRadius: 6,
                        marginVertical: 2
                      }}
                    >
                      <Text style={{ color: isSelected ? 'white' : '#A3A3A3', fontWeight: isSelected ? 'bold' : 'normal' }}>
                        {min}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Buttons Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setTimePickerVisible(false)}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmTimeSelection}
                style={{ flex: 1, backgroundColor: '#9457FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={datePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <View style={{ width: '90%', maxWidth: 340, backgroundColor: '#111111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18 }}>
            
            {/* Calendar Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              {/* Left Arrow */}
              <TouchableOpacity onPress={prevMonth} style={{ padding: 6 }}>
                <Feather name="chevron-left" size={20} color="white" />
              </TouchableOpacity>

              {/* Month & Year Triggers */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Month Trigger */}
                <TouchableOpacity 
                  onPress={() => setCalendarView(prev => prev === 'month' ? 'calendar' : 'month')}
                  style={{
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#1b1b1b', 
                    borderWidth: 1, 
                    borderColor: calendarView === 'month' ? '#9457FF' : 'rgba(255,255,255,0.1)', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 13, marginRight: 4 }}>
                    {monthsList[tempMonth].substring(0, 3)}
                  </Text>
                  <Feather name="chevron-down" size={12} color="#A3A3A3" />
                </TouchableOpacity>

                {/* Year Trigger */}
                <TouchableOpacity 
                  onPress={() => setCalendarView(prev => prev === 'year' ? 'calendar' : 'year')}
                  style={{
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#1b1b1b', 
                    borderWidth: 1, 
                    borderColor: calendarView === 'year' ? '#9457FF' : 'rgba(255,255,255,0.1)', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 13, marginRight: 4 }}>
                    {tempYear}
                  </Text>
                  <Feather name="chevron-down" size={12} color="#A3A3A3" />
                </TouchableOpacity>
              </View>

              {/* Right Arrow */}
              <TouchableOpacity onPress={nextMonth} style={{ padding: 6 }}>
                <Feather name="chevron-right" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Main Content Area based on View Mode */}
            {calendarView === 'calendar' && (
              <View style={{ marginBottom: 15 }}>
                {/* Weekdays Headers */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
                    <Text 
                      key={dayName} 
                      style={{ 
                        color: '#6b7280', 
                        fontSize: 12, 
                        fontWeight: '600', 
                        width: 38, 
                        textAlign: 'center' 
                      }}
                    >
                      {dayName}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                  {generateCalendarDays(tempYear, tempMonth).map((item, idx) => {
                    const isSelected = parseInt(tempDay) === item.day && 
                                      tempMonth === item.month && 
                                      tempYear === item.year;
                    
                    return (
                      <TouchableOpacity
                        key={`${item.year}-${item.month}-${item.day}-${idx}`}
                        onPress={() => {
                          setTempDay(item.day.toString().padStart(2, '0'));
                          setTempMonth(item.month);
                          setTempYear(item.year);
                        }}
                        style={{
                          width: 38,
                          height: 38,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#2c2c2c' : 'transparent',
                          borderRadius: 8,
                          marginVertical: 2
                        }}
                      >
                        <Text style={{
                          color: isSelected 
                            ? 'white' 
                            : item.isCurrentMonth 
                              ? 'white' 
                              : '#4B5563',
                          fontWeight: item.isCurrentMonth ? 'bold' : 'normal',
                          fontSize: 13
                        }}>
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {calendarView === 'month' && (
              <View style={{ height: 260, marginBottom: 15 }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', paddingVertical: 5 }}>
                    {monthsList.map((m, idx) => {
                      const isSelected = tempMonth === idx;
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            setTempMonth(idx);
                            setCalendarView('calendar');
                          }}
                          style={{
                            width: '30%',
                            height: 42,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: isSelected ? '#9457FF' : '#1b1b1b',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: isSelected ? 'bold' : 'normal', fontSize: 13 }}>
                            {m.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {calendarView === 'year' && (
              <View style={{ height: 260, marginBottom: 15 }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', paddingVertical: 5 }}>
                    {Array.from({ length: 15 }, (_, i) => {
                      const yr = new Date().getFullYear() - 7 + i;
                      const isSelected = tempYear === yr;
                      return (
                        <TouchableOpacity
                          key={yr}
                          onPress={() => {
                            setTempYear(yr);
                            setCalendarView('calendar');
                          }}
                          style={{
                            width: '30%',
                            height: 42,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: isSelected ? '#9457FF' : '#1b1b1b',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: isSelected ? 'bold' : 'normal', fontSize: 13 }}>
                            {yr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Buttons Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDateSelection}
                style={{ flex: 1, backgroundColor: '#9457FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
