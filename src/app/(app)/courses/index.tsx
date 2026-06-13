import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Plus, Building2, GraduationCap, Phone, Calendar, Clock, Link2, Trash2, X, Check, AlertTriangle, Hash, ExternalLink } from 'lucide-react-native';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useWorkspace } from '../../../hooks/use-workspace';
import { useAlert } from '../../../hooks/use-alert';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../../api/coursesApi';
import { colors } from '../../../constants/colors';

interface Course {
  id_courses: number;
  name: string;
  alias: string;
  lecturer: string;
  phone: string;
  day: string;
  start: string;
  end: string;
  room: string;
  sks: number;
  link: string;
  id_workspace: number;
}

export default function CoursesScreen() {
  const router = useRouter();
  const { activeWorkspaceId, activeWorkspaceName } = useWorkspace();
  const { showAlert } = useAlert();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAlias, setFormAlias] = useState('');
  const [formLecturer, setFormLecturer] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDay, setFormDay] = useState('');
  const [formStart, setFormStart] = useState('00:00');
  const [formEnd, setFormEnd] = useState('00:00');
  const [formRoom, setFormRoom] = useState('');
  const [formSks, setFormSks] = useState<number>(1);
  const [formLink, setFormLink] = useState('');

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Fetch Courses
  const fetchCourses = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCourses(activeWorkspaceId);
      if (data && Array.isArray(data)) {
        setCourses(data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      showAlert({
        title: 'Error',
        desc: 'Failed to load courses from backend.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeWorkspaceId]);

  // Format Helper: HH:MM:SS -> HH:MM
  const formatTime = (time: string) => {
    if (!time) return '00:00';
    return time.slice(0, 5);
  };

  // Search and Grouping
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const term = searchTerm.toLowerCase();
    return courses.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.alias || '').toLowerCase().includes(term) ||
        (c.lecturer || '').toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const groupedCourses = useMemo(() => {
    const base = dayOrder.reduce((acc, d) => ({ ...acc, [d]: [] as Course[] }), {} as Record<string, Course[]>);
    filteredCourses.forEach((c) => {
      const day = (c.day || '').trim();
      if (base[day]) {
        base[day].push(c);
      }
    });
    return base;
  }, [filteredCourses]);

  // Form Validation
  const isFormValid = useMemo(() => {
    return (
      formName.trim() !== '' &&
      formLecturer.trim() !== '' &&
      formDay.trim() !== '' &&
      formStart.trim() !== '' &&
      formEnd.trim() !== '' &&
      formSks > 0
    );
  }, [formName, formLecturer, formDay, formStart, formEnd, formSks]);

  // Open Modal for Add
  const openAddModal = () => {
    setEditingCourse(null);
    setFormName('');
    setFormAlias('');
    setFormLecturer('');
    setFormPhone('');
    setFormDay('Monday');
    setFormStart('08:00');
    setFormEnd('10:00');
    setFormRoom('');
    setFormSks(2);
    setFormLink('');
    setModalVisible(true);
  };

  // Open Modal for Edit
  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormName(course.name || '');
    setFormAlias(course.alias || '');
    setFormLecturer(course.lecturer || '');
    setFormPhone(course.phone || '');
    setFormDay(course.day || 'Monday');
    setFormStart(formatTime(course.start));
    setFormEnd(formatTime(course.end));
    setFormRoom(course.room || '');
    setFormSks(course.sks || 2);
    setFormLink(course.link || '');
    setModalVisible(true);
  };

  // Save changes (Create or Update)
  const handleSave = async () => {
    if (!isFormValid || !activeWorkspaceId) return;
    setActionLoading(true);

    const payload: any = {
      name: formName,
      alias: formAlias,
      lecturer: formLecturer,
      phone: formPhone,
      day: formDay,
      start: formStart,
      end: formEnd,
      room: formRoom,
      sks: formSks,
      link: formLink,
      id_workspace: activeWorkspaceId,
    };

    try {
      if (editingCourse) {
        // Edit Mode
        const { id_workspace, ...updateFields } = payload;
        await updateCourse(editingCourse.id_courses, updateFields);
        showAlert({
          title: 'Success',
          desc: 'Course updated successfully.',
          variant: 'success',
        });
      } else {
        // Add Mode
        await createCourse(payload);
        showAlert({
          title: 'Success',
          desc: 'Course added successfully.',
          variant: 'success',
        });
      }
      setModalVisible(false);
      fetchCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      showAlert({
        title: 'Error',
        desc: 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Course
  const handleDelete = async () => {
    if (!editingCourse) return;
    setActionLoading(true);
    try {
      await deleteCourse(editingCourse.id_courses);
      showAlert({
        title: 'Deleted',
        desc: 'Course removed successfully.',
        variant: 'success',
      });
      setModalVisible(false);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      showAlert({
        title: 'Error',
        desc: 'Failed to delete course.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // External Links Openers
  const openWhatsApp = (phoneStr: string) => {
    const cleaned = phoneStr.replace(/[^\d+]/g, '');
    const waUrl = cleaned.startsWith('+') ? `https://wa.me/${cleaned.slice(1)}` : `https://wa.me/${cleaned}`;
    Linking.openURL(waUrl).catch(() => {
      showAlert({
        title: 'Error',
        desc: 'Could not open WhatsApp.',
        variant: 'destructive',
      });
    });
  };

  const openExternalLink = (urlStr: string) => {
    const formattedUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    Linking.openURL(formattedUrl).catch(() => {
      showAlert({
        title: 'Error',
        desc: 'Could not open Link.',
        variant: 'destructive',
      });
    });
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Solid Black Background */}
      <View className="absolute inset-0 z-0 pointer-events-none bg-black" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 z-10"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="w-full px-4"
        >
          {/* Logo Section */}
          <View className="w-full mt-10">
            <View className="py-[22px] flex-row justify-between items-center">
              <Text className="text-[36px] font-extrabold tracking-wider text-white font-genos">
                <Text className="text-[#9457FF]">GRA</Text>DIA
              </Text>
              {activeWorkspaceName && (
                <View className="bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                  <Text className="text-white text-xs font-semibold font-inter">
                    {activeWorkspaceName}
                  </Text>
                </View>
              )}
            </View>

            {/* Courses Title & Subtitle */}
            <View className="mt-4">
              <Text className="font-bold text-[24px] text-white font-montserrat">
                Courses
              </Text>
              <Text className="text-[#A3A3A3] mt-2 text-sm leading-5 font-inter">
                Keep track of your courses all in one place.
              </Text>
            </View>
          </View>

          {/* Search bar */}
          <View className="flex-row items-center w-full mt-6 bg-[#141414] rounded-lg border border-white/10 px-3 py-2.5">
            <Search size={18} color="#A3A3A3" className="mr-2" />
            <TextInput
              placeholder="Search course, alias, or lecturer"
              placeholderTextColor="#A3A3A3"
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-white font-inter text-sm bg-transparent outline-none h-5"
            />
          </View>

          {/* Overview & Add Button */}
          <View className="flex-row items-center justify-between mt-8 pb-3 border-b border-white/10">
            <Text className="font-semibold text-white text-lg font-montserrat">
              Overview
            </Text>
            <TouchableOpacity onPress={openAddModal} activeOpacity={0.8}>
              <LinearGradient
                colors={['#34146C', '#28073B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                }}
              >
                <Plus size={16} color="#FAFAFA" />
                <Text className="text-white font-semibold font-inter text-sm">Add Course</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* List Days Container */}
          <View className="flex-col w-full gap-4 mt-6">
            {loading ? (
              <View className="py-12 justify-center items-center">
                <ActivityIndicator size="large" color="#9457FF" />
                <Text className="text-[#A3A3A3] text-sm mt-3 font-inter">Loading schedule...</Text>
              </View>
            ) : (
              dayOrder.map((day) => {
                const list = groupedCourses[day] || [];
                return (
                  <View key={day} className="flex-col gap-2">
                    {/* Day Row Header */}
                    <View className="w-full px-4 py-4 bg-black border border-white/5 flex-row justify-between items-center rounded-lg">
                      <Text className="font-semibold text-white text-base font-inter">{day}</Text>
                      <View className="w-6 h-6 bg-[#FDE047]/10 rounded-full flex justify-center items-center">
                        <Text className="text-[#FDE047] text-xs font-bold font-inter">{list.length}</Text>
                      </View>
                    </View>

                    {/* Courses Cards */}
                    <View className="flex-col gap-2">
                      {list.length > 0 ? (
                        list.map((course) => {
                          const dotColor =
                            course.sks === 3
                              ? 'bg-[#F87171]'
                              : course.sks === 2
                              ? 'bg-[#FDE047]'
                              : 'bg-[#22D3EE]';
                          return (
                            <TouchableOpacity
                              key={course.id_courses}
                              onPress={() => openEditModal(course)}
                              activeOpacity={0.95}
                              className="w-full bg-[#141414] rounded-lg p-4 border border-white/5 flex-col gap-3"
                            >
                              {/* Card Top Row: SKS indicator dot and Time */}
                              <View className="flex-row items-center gap-2">
                                <View className={`w-3 h-3 rounded-full ${dotColor}`} />
                                <Text className="text-[#A3A3A3] font-inter text-sm">
                                  {formatTime(course.start)} - {formatTime(course.end)}
                                </Text>
                              </View>

                              {/* Card Title & Alias */}
                              <Text className="font-bold text-white text-base font-inter">
                                {course.name}{' '}
                                {course.alias && (
                                  <Text className="text-[#9457FF] uppercase">({course.alias})</Text>
                                )}
                              </Text>

                              {/* Card Info Rows */}
                              <View className="flex-col gap-1.5 mt-1">
                                {course.room && (
                                  <View className="flex-row items-center gap-2">
                                    <Building2 size={16} color="#643EB2" />
                                    <Text className="text-[#A3A3A3] text-sm font-inter uppercase">
                                      {course.room}
                                    </Text>
                                  </View>
                                )}
                                {course.lecturer && (
                                  <View className="flex-row items-center gap-2">
                                    <GraduationCap size={16} color="#643EB2" />
                                    <Text className="text-[#A3A3A3] text-sm font-inter">
                                      {course.lecturer}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View className="w-full h-20 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f]/40 p-4">
                          <Text className="text-neutral-600 text-sm font-inter">No courses</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
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
                {editingCourse ? 'Course Details' : 'Add Course'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-1 rounded-full bg-white/10"
              >
                <X size={18} color="#FAFAFA" />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Fields */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 15 }}
              className="flex-1 my-2"
            >
              <KeyboardAvoidingView behavior="padding" className="flex-col gap-4">
                {/* Course Name Textarea */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Course Name *
                  </Text>
                  <TextInput
                    placeholder="Enter your course name here"
                    placeholderTextColor="#666"
                    value={formName}
                    onChangeText={setFormName}
                    multiline
                    numberOfLines={2}
                    className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg p-3 text-white font-inter text-base"
                    style={{ minHeight: 60, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Alias Input */}
                <View className="flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2">
                  <Hash size={16} color="#A3A3A3" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Alias</Text>
                    <TextInput
                      placeholder="e.g. ABP"
                      placeholderTextColor="#666"
                      value={formAlias}
                      onChangeText={setFormAlias}
                      className="text-white font-inter text-sm mt-0.5"
                    />
                  </View>
                </View>

                {/* Lecturer Input */}
                <View className="flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2">
                  <GraduationCap size={16} color="#A3A3A3" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Lecturer *</Text>
                    <TextInput
                      placeholder="Lecturer name"
                      placeholderTextColor="#666"
                      value={formLecturer}
                      onChangeText={setFormLecturer}
                      className="text-white font-inter text-sm mt-0.5"
                    />
                  </View>
                </View>

                {/* Phone Input with WhatsApp Link */}
                <View className="flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 relative">
                  <Phone size={16} color="#A3A3A3" className="mr-3" />
                  <View className="flex-1 pr-10">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Phone</Text>
                    <TextInput
                      placeholder="Lecturer's phone number"
                      placeholderTextColor="#666"
                      value={formPhone}
                      onChangeText={setFormPhone}
                      keyboardType="phone-pad"
                      className="text-white font-inter text-sm mt-0.5"
                    />
                  </View>
                  {formPhone.trim() !== '' && (
                    <TouchableOpacity
                      onPress={() => openWhatsApp(formPhone)}
                      className="absolute right-3 bg-[#25D366]/20 p-2 rounded-lg"
                    >
                      <Phone size={16} color="#25D366" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Day Input - Horizontal Select Selector */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    Day *
                  </Text>
                  <View className="flex-row justify-between bg-[#1b1b1b] p-1 border border-white/10 rounded-lg">
                    {dayOrder.map((day) => {
                      const isSelected = formDay === day;
                      const shortDay = day.slice(0, 3);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setFormDay(day)}
                          activeOpacity={0.8}
                          className={`flex-1 items-center justify-center py-2.5 rounded-md ${
                            isSelected ? 'bg-[#9457FF]' : 'bg-transparent'
                          }`}
                        >
                          <Text
                            className={`font-semibold text-xs font-inter ${
                              isSelected ? 'text-white' : 'text-[#A3A3A3]'
                            }`}
                          >
                            {shortDay}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Start / End Time Inputs */}
                <View className="flex-row gap-3">
                  <View className="flex-1 flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2">
                    <Clock size={16} color="#A3A3A3" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Start *</Text>
                      <TextInput
                        placeholder="08:00"
                        placeholderTextColor="#666"
                        value={formStart}
                        onChangeText={setFormStart}
                        className="text-white font-inter text-sm mt-0.5"
                      />
                    </View>
                  </View>

                  <View className="flex-1 flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2">
                    <Clock size={16} color="#A3A3A3" className="mr-3" />
                    <View className="flex-1">
                      <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">End *</Text>
                      <TextInput
                        placeholder="10:00"
                        placeholderTextColor="#666"
                        value={formEnd}
                        onChangeText={setFormEnd}
                        className="text-white font-inter text-sm mt-0.5"
                      />
                    </View>
                  </View>
                </View>

                {/* Room Input */}
                <View className="flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2">
                  <Building2 size={16} color="#A3A3A3" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Room</Text>
                    <TextInput
                      placeholder="e.g. Room 302"
                      placeholderTextColor="#666"
                      value={formRoom}
                      onChangeText={setFormRoom}
                      className="text-white font-inter text-sm mt-0.5"
                    />
                  </View>
                </View>

                {/* SKS Segmented Control */}
                <View className="flex-col gap-2">
                  <Text className="text-xs font-semibold text-[#A3A3A3] uppercase font-inter">
                    SKS *
                  </Text>
                  <View className="flex-row gap-3">
                    {[1, 2, 3].map((num) => {
                      const isSelected = formSks === num;
                      let highlightBg = 'bg-transparent';
                      let highlightBorder = 'border-white/10';
                      let activeText = 'text-[#A3A3A3]';

                      if (isSelected) {
                        activeText = 'text-white';
                        if (num === 3) {
                          highlightBg = 'bg-[#F87171]/20';
                          highlightBorder = 'border-[#F87171]';
                        } else if (num === 2) {
                          highlightBg = 'bg-[#FDE047]/20';
                          highlightBorder = 'border-[#FDE047]';
                        } else {
                          highlightBg = 'bg-[#22D3EE]/20';
                          highlightBorder = 'border-[#22D3EE]';
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={num}
                          onPress={() => setFormSks(num)}
                          activeOpacity={0.8}
                          className={`flex-1 items-center justify-center py-2.5 rounded-lg border ${highlightBg} ${highlightBorder}`}
                        >
                          <Text className={`font-bold font-inter text-sm ${activeText}`}>
                            {num} SKS
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Link Input with URL Opener */}
                <View className="flex-row items-center bg-[#1b1b1b] border border-white/10 rounded-lg px-3 py-2 relative">
                  <Link2 size={16} color="#A3A3A3" className="mr-3" />
                  <View className="flex-1 pr-10">
                    <Text className="text-[10px] text-[#A3A3A3] uppercase font-inter">Link</Text>
                    <TextInput
                      placeholder="e.g. meet.google.com/abc"
                      placeholderTextColor="#666"
                      value={formLink}
                      onChangeText={setFormLink}
                      className="text-white font-inter text-sm mt-0.5"
                    />
                  </View>
                  {formLink.trim() !== '' && (
                    <TouchableOpacity
                      onPress={() => openExternalLink(formLink)}
                      className="absolute right-3 bg-white/10 p-2 rounded-lg"
                    >
                      <ExternalLink size={16} color="#FAFAFA" />
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>
            </ScrollView>

            {/* Modal Footer Controls */}
            <View className="flex-row items-center justify-between border-t border-white/5 pt-4 mt-1 gap-3">
              {editingCourse ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={actionLoading}
                  className="bg-[#EF4444]/20 border border-[#EF4444] p-3 rounded-lg flex-row items-center justify-center gap-2 flex-1"
                >
                  <Trash2 size={18} color="#F87171" />
                  <Text className="text-[#F87171] font-semibold font-inter">Delete</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-white/5 border border-white/10 p-3 rounded-lg items-center justify-center flex-1"
                >
                  <Text className="text-white font-semibold font-inter">Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSave}
                disabled={!isFormValid || actionLoading}
                className="flex-[2]"
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
                    opacity: (!isFormValid || actionLoading) ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FAFAFA" />
                  ) : (
                    <Text className="text-white font-semibold font-inter text-base">
                      {editingCourse ? 'Save Changes' : 'Add Course'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
