import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, ChevronDown, X, Check, Menu, 
  ArrowRightCircle, Calendar, Clock, MapPin, Trash2
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/screen-container';
import { useWorkspace } from '../../hooks/use-workspace';
import { useAlert } from '../../hooks/use-alert';
import { getPresences, createPresence, updatePresence, deletePresence } from '../../api/presencesApi';
import { getCoursesToday } from '../../api/coursesApi';

export default function PresencesScreen() {
  const router = useRouter();
  const { activeWorkspaceId } = useWorkspace();
  const { showAlert } = useAlert();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [cLoading, setCLoading] = useState(true);
  
  const [presences, setPresences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [popupMode, setPopupMode] = useState<'add' | 'edit' | null>(null);
  const [popupData, setPopupData] = useState<any>(null);
  const [note, setNote] = useState('');
  const [statusSelection, setStatusSelection] = useState('Present');
  const [submitting, setSubmitting] = useState(false);

  // Fetch courses and presences
  const loadData = useCallback(async () => {
    if (!activeWorkspaceId) {
      setCLoading(false);
      setLoading(false);
      return;
    }
    
    setCLoading(true);
    setLoading(true);
    
    try {
      // 1. Fetch courses scheduled today
      const todayCourses = await getCoursesToday(activeWorkspaceId);
      setCourses(todayCourses || []);

      // 2. Fetch presence records
      const presenceList = await getPresences(activeWorkspaceId);
      
      // format dates and times
      const formatted = (presenceList || []).map((item: any) => {
        const dateObj = new Date(item.presences_at);
        const date = dateObj.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const time = dateObj.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          ...item,
          id: item.id_presence,
          date,
          time,
          course: item.course_name,
          room: item.course_room,
          sks: item.course_sks,
          start: item.course_start,
          end: item.course_end
        };
      });
      setPresences(formatted);
    } catch (err: any) {
      console.error('[PresencesScreen] Failed to load data:', err);
      showAlert({
        title: 'Error Loading Data',
        desc: err.message || 'Could not fetch data from database.',
        variant: 'destructive'
      });
    } finally {
      setCLoading(false);
      setLoading(false);
    }
  }, [activeWorkspaceId, showAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute stats
  const totalPresence = useMemo(() => presences.filter((p) => p.status === 'Present').length, [presences]);
  const totalAbsent = useMemo(() => presences.filter((p) => p.status === 'Absent').length, [presences]);

  // Compute attended course ids for today
  const attendedCourseIds = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return presences
      .filter((p) => {
        const d = new Date(p.created_at || p.presences_at);
        return d.toDateString() === todayStr;
      })
      .map((p) => p.id_course);
  }, [presences]);

  // Search filter
  const filteredLogs = useMemo(() => {
    return presences.filter((item) =>
      item.course?.toLowerCase().includes(search.toLowerCase())
    );
  }, [presences, search]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const currentPageData = useMemo(
    () => filteredLogs.slice(start, end),
    [filteredLogs, start, end]
  );

  const toggleRowsPerPage = () => {
    if (rowsPerPage === 5) setRowsPerPage(10);
    else if (rowsPerPage === 10) setRowsPerPage(25);
    else setRowsPerPage(5);
    setPage(1);
  };

  const handleCardClick = (course: any) => {
    setPopupData(course);
    setStatusSelection('Present');
    setNote('');
    setPopupMode('add');
  };

  const handleRowClick = (presence: any) => {
    setPopupData(presence);
    setStatusSelection(presence.status);
    setNote(presence.note || '');
    setPopupMode('edit');
  };

  const handleClosePopup = () => {
    setPopupData(null);
    setPopupMode(null);
  };

  const handleSubmit = async () => {
    if (!activeWorkspaceId || !popupData) return;
    setSubmitting(true);
    try {
      if (popupMode === 'add') {
        await createPresence({
          id_course: popupData.id_course,
          id_workspace: activeWorkspaceId,
          status: statusSelection,
          note: note.trim() || undefined
        });
        showAlert({
          title: 'Presence Logged',
          desc: `Attendance marked as ${statusSelection} for ${popupData.name}.`,
          variant: 'success'
        });
      } else if (popupMode === 'edit') {
        await updatePresence(popupData.id_presence || popupData.id, {
          status: statusSelection,
          note: note.trim() || undefined
        });
        showAlert({
          title: 'Presence Updated',
          desc: 'Attendance record updated successfully.',
          variant: 'success'
        });
      }
      handleClosePopup();
      await loadData();
    } catch (err: any) {
      console.error('[PresencesScreen] Submit failed:', err);
      showAlert({
        title: 'Operation Failed',
        desc: err.message || 'Could not save presence record.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!popupData) return;
    setSubmitting(true);
    try {
      await deletePresence(popupData.id_presence || popupData.id);
      showAlert({
        title: 'Presence Deleted',
        desc: 'Attendance record removed successfully.',
        variant: 'success'
      });
      handleClosePopup();
      await loadData();
    } catch (err: any) {
      console.error('[PresencesScreen] Delete failed:', err);
      showAlert({
        title: 'Deletion Failed',
        desc: err.message || 'Could not delete presence record.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 20 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* Top Navbar */}
          <View className="w-full mt-6 mb-8 flex-row justify-between items-center">
            <Text className="text-2xl font-extrabold tracking-wider text-white font-genos">
              <Text className="text-[#9457FF]">GRA</Text>DIA
            </Text>
            <TouchableOpacity onPress={() => router.push('/workspaces')}>
              <Menu size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View className="w-full mb-6">
            <Text className="font-montserrat text-[20px] font-semibold text-white">Presences</Text>
            <Text className="text-[#A3A3A3] mt-2 text-[14px] font-inter leading-5">
              Monitor and manage attendance records with access to presence logs.
            </Text>
          </View>

          {/* Stats Box */}
          <View className="w-full border border-[#2c2c2c]/50 rounded-[12px] p-4 mb-6 bg-[#141414]">
            <Text className="text-white font-semibold text-center text-[20px] mb-4 font-montserrat">Total Presence</Text>
            
            <View className="flex-row justify-center items-center gap-8">
              <View className="items-center gap-2.5">
                <View className="w-[44px] h-[44px] rounded-md bg-[#22C55E]/15 items-center justify-center border border-[#22C55E]/30">
                  <Text className="text-[#4ADE80] font-inter text-[20px] font-bold">{totalPresence}</Text>
                </View>
                <Text className="text-white font-inter text-[14px]">Presence</Text>
              </View>

              <View className="items-center gap-2.5">
                <View className="w-[44px] h-[44px] rounded-md bg-[#EF4444]/15 items-center justify-center border border-[#EF4444]/30">
                  <Text className="text-[#F87171] font-inter text-[20px] font-bold">{totalAbsent}</Text>
                </View>
                <Text className="text-white font-inter text-[14px]">Absent</Text>
              </View>
            </View>
          </View>

          {/* Today's Courses horizontal slider */}
          <View className="w-full mb-8">
            <Text className="text-white font-semibold text-[16px] mb-4 font-montserrat">Courses Today</Text>
            {cLoading ? (
              <View className="w-full h-[184px] justify-center items-center bg-[#141414] border border-[#2c2c2c]/50 rounded-[12px]">
                <ActivityIndicator size="small" color="#9457FF" />
              </View>
            ) : courses.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {courses.map((item, idx) => {
                  const isAttended = attendedCourseIds.includes(item.id_course);
                  return (
                    <LinearGradient
                      key={idx}
                      colors={isAttended ? ['#0d0d0e', '#050505'] : ['#1a1230', '#141414']}
                      className={`rounded-[12px] p-4 border border-[#464646]/50 mr-4 w-[269px] ${
                        isAttended ? 'opacity-60' : ''
                      }`}
                    >
                      <View className="flex-row items-center gap-[8px]">
                        <Clock size={14} color={isAttended ? "#A3A3A3" : "#C084FC"} />
                        <Text className="text-[#A3A3A3] font-inter text-[14px]">
                          {item.start?.slice(0, 5)} - {item.end?.slice(0, 5)}
                        </Text>
                      </View>
                      
                      <Text className="font-semibold text-white text-[18px] mt-3 font-montserrat" numberOfLines={2}>
                        {item.name}
                      </Text>
                      
                      <View className="flex-row items-center gap-1 mt-2">
                        <MapPin size={13} color="#A3A3A3" />
                        <Text className="text-[#A3A3A3] uppercase text-[12px] font-inter">{item.room}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        disabled={isAttended}
                        onPress={() => handleCardClick(item)}
                        className={`mt-4 self-start flex-row items-center px-4 py-2.5 rounded-lg border ${
                          isAttended 
                            ? 'bg-transparent border-[#2c2c2c]' 
                            : 'bg-[#9457FF]/80 border-[#9457FF]'
                        }`}
                      >
                        <Text className="text-white text-[13px] font-semibold mr-2 font-inter">
                          {isAttended ? 'Logged Presence' : 'Log Presence'}
                        </Text>
                        {!isAttended && <ArrowRightCircle size={15} color="#FAFAFA" />}
                      </TouchableOpacity>
                    </LinearGradient>
                  );
                })}
              </ScrollView>
            ) : (
              <LinearGradient
                colors={['#141414', '#070707']}
                style={{
                  width: '100%',
                  height: 184,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(44, 44, 44, 0.5)',
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#A3A3A3', fontFamily: 'Inter', fontSize: 14 }}>
                  No courses are scheduled for today.
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Search bar */}
          <View className="w-full border border-[#2c2c2c] rounded-lg bg-transparent flex-row items-center px-3 py-2.5 mb-6">
            <Search size={18} color="#A3A3A3" />
            <TextInput 
              value={search}
              onChangeText={(txt) => {
                setSearch(txt);
                setPage(1);
              }}
              placeholder="Search course"
              placeholderTextColor="#A3A3A3"
              className="flex-1 ml-3 text-white font-inter text-[14px] p-0"
            />
          </View>

          {/* Table Control Header */}
          <View className="w-full flex-row justify-between items-center border-b border-[#2c2c2c]/50 pb-3 mb-3">
            <Text className="text-white font-semibold text-[18px] font-montserrat">Log Presence</Text>
            
            <View className="flex-row items-center gap-2">
              <Text className="text-[#A3A3A3] text-[14px] font-inter">Showing</Text>
              <TouchableOpacity 
                onPress={toggleRowsPerPage}
                className="border border-[#2c2c2c] bg-[#141414] rounded-md px-3 py-1 flex-row items-center active:bg-zinc-800"
              >
                <Text className="text-[#A3A3A3] text-[14px] mr-2 font-inter font-semibold">{rowsPerPage}</Text>
                <ChevronDown size={14} color="#FAFAFA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Presence Table */}
          <View className="w-full border border-[#2c2c2c] bg-[#141414] rounded-2xl p-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View className="min-w-[620px]">
                
                <View className="flex-row border-b border-[#2c2c2c] pb-3 mb-2 px-2">
                  <Text className="text-white font-semibold text-[14px] w-[40px] text-center font-montserrat">No</Text>
                  <Text className="text-white font-semibold text-[14px] w-[100px] text-center font-montserrat">Date</Text>
                  <Text className="text-white font-semibold text-[14px] w-[160px] text-left pl-2 font-montserrat">Courses</Text>
                  <Text className="text-white font-semibold text-[14px] w-[80px] text-center font-montserrat">Time</Text>
                  <Text className="text-white font-semibold text-[14px] w-[100px] text-center font-montserrat">Status</Text>
                  <Text className="text-white font-semibold text-[14px] w-[120px] text-left pl-2 font-montserrat">Note</Text>
                </View>

                <View className="bg-black rounded-xl min-h-[120px] justify-center">
                  {loading ? (
                    <ActivityIndicator size="small" color="#9457FF" />
                  ) : currentPageData.length === 0 ? (
                    <View className="items-center py-6">
                      <Text className="text-[#A3A3A3] text-[14px] font-inter">No presence data found.</Text>
                    </View>
                  ) : (
                    currentPageData.map((row, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        onPress={() => handleRowClick(row)}
                        className="flex-row px-2 py-4 border-b border-[#2c2c2c]/40 items-center active:bg-zinc-900"
                      >
                        <Text className="text-[#A3A3A3] text-[14px] w-[40px] text-center font-inter">
                          {String(start + idx + 1).padStart(2, '0')}
                        </Text>
                        <Text className="text-[#A3A3A3] text-[14px] w-[100px] text-center font-inter">{row.date}</Text>
                        <Text className="text-white text-[14px] w-[160px] text-left pl-2 font-inter font-semibold" numberOfLines={1}>
                          {row.course}
                        </Text>
                        <Text className="text-[#A3A3A3] text-[14px] w-[80px] text-center font-inter">{row.time}</Text>
                        <View className="w-[100px] items-center justify-center">
                          <View className={`px-2.5 py-1 rounded-full ${
                            row.status === 'Present' ? 'bg-[#22C55E]/15' : 'bg-[#EF4444]/15'
                          }`}>
                            <Text className={`text-[12px] font-bold font-inter ${
                              row.status === 'Present' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                            }`}>
                              {row.status}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[#888888] text-[13px] w-[120px] text-left pl-2 font-inter" numberOfLines={1}>
                          {row.note || '-'}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Pagination Buttons */}
          <View className="w-full flex-row justify-between items-center py-2 mt-2">
            <TouchableOpacity 
              disabled={page === 1}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              className={`bg-[#141414] border border-[#2c2c2c] rounded px-4 py-2 ${
                page === 1 ? 'opacity-40' : 'active:bg-zinc-800'
              }`}
            >
              <Text className="text-white text-[14px] font-semibold font-inter">Previous</Text>
            </TouchableOpacity>
            
            <Text className="text-[#A3A3A3] text-[14px] font-inter">
              Page {page} of {totalPages}
            </Text>

            <TouchableOpacity 
              disabled={page >= totalPages}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              className={`bg-[#141414] border border-[#2c2c2c] rounded px-4 py-2 ${
                page >= totalPages ? 'opacity-40' : 'active:bg-zinc-800'
              }`}
            >
              <Text className="text-white text-[14px] font-semibold font-inter">Next</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add / Edit Presence Modal */}
      <Modal visible={popupMode !== null} transparent={true} animationType="fade" onRequestClose={handleClosePopup}>
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-[#15171A] border border-[#2c2c2c] w-[90%] max-w-[400px] rounded-2xl p-4">
            
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-semibold text-[18px] font-montserrat">
                {popupMode === 'add' ? 'Log Presence' : 'Edit Presence'}
              </Text>
              <TouchableOpacity onPress={handleClosePopup}>
                <X size={24} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            <View className="bg-[#0f0f10] border border-[#2c2c2c] rounded-xl p-4">
              <Text className="text-white font-semibold text-[16px] mb-1 font-montserrat">
                {popupData?.course || popupData?.name || 'Course Name'}
              </Text>
              <Text className="text-[#A3A3A3] text-[14px] mb-4 font-inter">
                {popupData?.room || '-'}
              </Text>

              <View className="flex-row gap-3 mb-5">
                <TouchableOpacity 
                  onPress={() => setStatusSelection('Present')}
                  className={`flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${
                    statusSelection === 'Present' 
                      ? 'bg-[#22C55E]/15 border-[#22C55E]/30' 
                      : 'bg-[#1b1b1b] border-[#2c2c2c]'
                  }`}
                >
                  <Text className={`font-semibold font-inter ${
                    statusSelection === 'Present' ? 'text-[#4ADE80]' : 'text-zinc-400'
                  }`}>Present</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setStatusSelection('Absent')}
                  className={`flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${
                    statusSelection === 'Absent' 
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/30' 
                      : 'bg-[#1b1b1b] border-[#2c2c2c]'
                  }`}
                >
                  <Text className={`font-semibold font-inter ${
                    statusSelection === 'Absent' ? 'text-[#F87171]' : 'text-zinc-400'
                  }`}>Absent</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-[#A3A3A3] text-[14px] mb-2 font-inter font-medium">Add Notes</Text>
              <TextInput 
                value={note}
                onChangeText={setNote}
                placeholder="Type notes..."
                placeholderTextColor="#6b7280"
                multiline
                className="w-full bg-transparent border border-[#2c2c2c] rounded-lg p-3 text-white h-[80px] text-top font-inter"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row justify-between items-center mt-6">
                {popupMode === 'edit' ? (
                  <TouchableOpacity
                    disabled={submitting}
                    onPress={handleDeleteRecord}
                    className="flex-row items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/25 active:bg-[#ef4444]/20"
                  >
                    <Trash2 size={15} color="#F87171" />
                    <Text className="text-[#F87171] font-semibold text-[13px] font-inter">Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
                
                <TouchableOpacity 
                  disabled={submitting}
                  onPress={handleSubmit}
                  className="flex-row items-center gap-2 px-5 py-2.5 rounded-lg active:opacity-90"
                  style={{ backgroundColor: '#9457FF' }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FAFAFA" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-[14px] font-inter">
                        {popupMode === 'add' ? 'Log Presence' : 'Save Changes'}
                      </Text>
                      <Check size={15} color="#FAFAFA" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}