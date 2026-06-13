import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const [form, setForm] = useState({
    title: '', 
    description: '', 
    priority: 'High', 
    status: 'Not started', 
    id_course: null as number | null,
    deadlineDate: '', 
    deadlineTime: '23:59'
  });

  const fetchTasks = async () => {
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
  };

  const fetchCourses = async () => {
    if (!activeWorkspaceId) return;
    try {
      const data = await getCourses(activeWorkspaceId);
      setCourses(data || []);
    } catch (err) {
      console.error('[TasksScreen] Error loading courses:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCourses();
  }, [activeWorkspaceId]);

  const groupedTasks = useMemo(() => ({
    'Not started': tasks.filter(t => t.status === 'Not started'),
    'In progress': tasks.filter(t => t.status === 'In progress'),
    'Completed': tasks.filter(t => t.status === 'Completed'),
    'Overdue': tasks.filter(t => t.status === 'Overdue'),
  }), [tasks]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleOpenDrawer = (taskItem: any = null) => {
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

      {/* === MODAL DRAWER ADD/EDIT === */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2c2c2c', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', height: '85%' }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#2c2c2c' }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                  {selectedTask ? 'Edit Task' : 'Add New Task'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#2c2c2c', borderRadius: 16, padding: 6 }}>
                  <Feather name="x" size={20} color="#A3A3A3" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
                <TextInput 
                  value={form.title}
                  onChangeText={(t) => setForm(prev => ({ ...prev, title: t }))}
                  placeholder="Enter Your Task Name"
                  placeholderTextColor="#6B7280"
                  multiline
                  style={{ color: 'white', fontWeight: 'bold', fontSize: 28, marginBottom: 24, lineHeight: 36 }}
                />

                <View style={{ gap: 24 }}>
                  {/* Course Selection */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Feather name="book" size={18} color="#A3A3A3" style={{ marginTop: 4 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 8 }}>Course *</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {courses.map((c) => {
                          const isSelected = form.id_course === c.id_courses;
                          return (
                            <TouchableOpacity 
                              key={c.id_courses} 
                              onPress={() => setForm(prev => ({ ...prev, id_course: c.id_courses }))}
                              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, backgroundColor: isSelected ? 'rgba(148,87,255,0.2)' : '#1b1b1b', borderColor: isSelected ? '#9457FF' : '#2c2c2c', marginRight: 8, marginBottom: 8 }}
                            >
                              <Text style={{ color: isSelected ? 'white' : '#A3A3A3' }}>{c.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                        {courses.length === 0 && (
                          <Text style={{ color: '#6B7280', fontSize: 14, fontStyle: 'italic' }}>No courses available. Please add a course first.</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Feather name="file-text" size={18} color="#A3A3A3" style={{ marginTop: 4 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 4 }}>Description</Text>
                      <TextInput 
                        value={form.description}
                        onChangeText={(t) => setForm(prev => ({ ...prev, description: t }))}
                        placeholder="Add a short description"
                        placeholderTextColor="#6B7280"
                        style={{ color: 'white', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#2c2c2c', paddingBottom: 8 }}
                      />
                    </View>
                  </View>

                  {/* Deadline Date and Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Feather name="calendar" size={18} color="#A3A3A3" style={{ marginTop: 4 }} />
                    <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 4 }}>Deadline Date *</Text>
                        <TextInput 
                          value={form.deadlineDate}
                          onChangeText={(t) => setForm(prev => ({ ...prev, deadlineDate: t }))}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#6B7280"
                          style={{ color: 'white', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#2c2c2c', paddingBottom: 8 }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 4 }}>Time *</Text>
                        <TextInput 
                          value={form.deadlineTime}
                          onChangeText={(t) => setForm(prev => ({ ...prev, deadlineTime: t }))}
                          placeholder="HH:MM"
                          placeholderTextColor="#6B7280"
                          style={{ color: 'white', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#2c2c2c', paddingBottom: 8 }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Priority */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Feather name="alert-circle" size={18} color="#A3A3A3" style={{ marginTop: 4 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 8 }}>Priority</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {['High', 'Medium', 'Low'].map((p) => (
                          <TouchableOpacity 
                            key={p} 
                            onPress={() => setForm(prev => ({ ...prev, priority: p }))}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, backgroundColor: form.priority === p ? 'rgba(148,87,255,0.2)' : '#1b1b1b', borderColor: form.priority === p ? '#9457FF' : '#2c2c2c', marginRight: 8 }}
                          >
                            <Text style={{ color: form.priority === p ? 'white' : '#A3A3A3' }}>{p}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Feather name="loader" size={18} color="#A3A3A3" style={{ marginTop: 4 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A3A3A3', fontSize: 13, marginBottom: 8 }}>Status</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {['Not started', 'In progress', 'Completed', 'Overdue'].map((s) => (
                          <TouchableOpacity 
                            key={s} 
                            onPress={() => setForm(prev => ({ ...prev, status: s }))}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, backgroundColor: form.status === s ? 'rgba(148,87,255,0.2)' : '#1b1b1b', borderColor: form.status === s ? '#9457FF' : '#2c2c2c', marginRight: 8, marginBottom: 8 }}
                          >
                            <Text style={{ color: form.status === s ? 'white' : '#A3A3A3' }}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Footer Buttons */}
              <View style={{ position: 'absolute', bottom: 0, width: '100%', padding: 16, borderTopWidth: 1, borderTopColor: '#2c2c2c', backgroundColor: '#111111', flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                {selectedTask && (
                  <TouchableOpacity 
                    onPress={handleDelete}
                    disabled={actionLoading}
                    style={{ backgroundColor: '#830404', width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {actionLoading ? <ActivityIndicator size="small" color="#FAFAFA" /> : <Feather name="trash-2" size={20} color="#FAFAFA" />}
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={handleSave} disabled={actionLoading} style={{ flex: 1 }}>
                  <LinearGradient 
                    colors={['#34146C', '#28073B']} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 1}} 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 8, opacity: actionLoading ? 0.5 : 1 }}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FAFAFA" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name={selectedTask ? "save" : "plus"} size={18} color="#FAFAFA" />
                        <Text style={{ color: 'white', fontWeight: '500' }}>{selectedTask ? 'Save changes' : 'Add task'}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScreenContainer>
  );
}
