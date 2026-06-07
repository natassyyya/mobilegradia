import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';

export default function PresencesScreen() {
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

  useEffect(() => {
    setCLoading(true);
    setLoading(true);
    setTimeout(() => {
      setCourses([]); 
      setPresences([]);
      setCLoading(false);
      setLoading(false);
    }, 1000);
  }, []);

  const totalPresence = presences.filter((p) => p.status === 'Present').length;
  const totalAbsent = presences.filter((p) => p.status === 'Absent').length;

  const filteredLogs = presences.filter((item) =>
    item.course?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  const handleCardClick = (course: any) => {
    setPopupData(course);
    setStatusSelection('Present');
    setNote('');
    setPopupMode('add');
  };

  const handleClosePopup = () => {
    setPopupData(null);
    setPopupMode(null);
  };

  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0, backgroundColor: '#000000' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60, paddingHorizontal: 20 }}>
          
          <View className="w-full mt-6 mb-8 flex-row justify-between items-center">
            <Text className="text-2xl font-extrabold tracking-wider text-white font-genos">
              <Text className="text-[#9457FF]">GRA</Text>DIA
            </Text>
            <TouchableOpacity>
              <Feather name="menu" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          <View className="w-full mb-6">
            <Text className="font-montserrat text-[20px] font-semibold text-white">Presences</Text>
            <Text className="text-[#A3A3A3] mt-2 text-[14px] font-inter leading-5">
              Monitor and manage attendance records with access to presence logs.
            </Text>
          </View>

          <View className="w-full border border-[#2c2c2c]/50 rounded-[12px] p-4 mb-6">
            <Text className="text-white font-semibold text-center text-[20px] mb-4">Total Presence</Text>
            
            <View className="flex-row justify-center items-center gap-8">
              <View className="items-center gap-2.5">
                <View className="w-[44px] h-[44px] rounded-md bg-[#22C55E]/20 items-center justify-center">
                  <Text className="text-[#4ADE80] font-inter text-[20px] font-bold">{totalPresence}</Text>
                </View>
                <Text className="text-white font-inter text-[14px]">Presence</Text>
              </View>

              <View className="items-center gap-2.5">
                <View className="w-[44px] h-[44px] rounded-md bg-[#EF4444]/20 items-center justify-center">
                  <Text className="text-[#F87171] font-inter text-[20px] font-bold">{totalAbsent}</Text>
                </View>
                <Text className="text-white font-inter text-[14px]">Absent</Text>
              </View>
            </View>
          </View>

          <View className="w-full mb-8">
            {cLoading ? (
              <ActivityIndicator size="small" color="#9457FF" />
            ) : courses.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {courses.map((item, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={['#141414', '#070707']}
                    className="rounded-[8px] p-3 border border-[#464646]/50 mr-4 w-[269px]"
                  >
                    <View className="flex-row items-center gap-[10px]">
                      <View className="w-3 h-3 rounded-full bg-[#ef4444]" />
                      <Text className="text-[#A3A3A3] font-inter text-[14px]">{item.start} - {item.end}</Text>
                    </View>
                    <Text className="font-semibold text-white text-[20px] mt-2 line-clamp-2">{item.name}</Text>
                    <Text className="text-[#A3A3A3] uppercase text-sm mt-1">{item.room}</Text>
                    
                    <TouchableOpacity 
                      onPress={() => handleCardClick(item)}
                      className="mt-4 self-start flex-row items-center bg-white/10 px-3 py-2 rounded-md"
                    >
                      <Text className="text-white text-[14px] mr-2">Log presence</Text>
                      <Feather name="log-in" size={16} color="#FAFAFA" />
                    </TouchableOpacity>
                  </LinearGradient>
                ))}
              </ScrollView>
            ) : (
              <LinearGradient
                colors={['#141414', '#070707']}
                className="w-full h-[184px] flex justify-center items-center border border-[#2c2c2c]/50 rounded-[12px]"
              >
                <Text className="text-[#A3A3A3] font-inter text-[14px]">
                  No courses are scheduled for today.
                </Text>
              </LinearGradient>
            )}
          </View>

          <View className="w-full border border-[#2c2c2c] rounded-lg bg-transparent flex-row items-center px-3 py-2 mb-8">
            <Feather name="search" size={18} color="#A3A3A3" />
            <TextInput 
              value={search}
              onChangeText={setSearch}
              placeholder="Search course"
              placeholderTextColor="#A3A3A3"
              className="flex-1 ml-3 text-white font-inter text-[14px] h-[24px]"
            />
          </View>

          <View className="w-full flex-row justify-between items-center border-b border-[#2c2c2c]/50 pb-3 mb-3">
            <Text className="text-white font-semibold text-[18px]">Log Presence</Text>
            
            <View className="flex-row items-center gap-2">
              <Text className="text-[#A3A3A3] text-[14px]">Showing</Text>
              <View className="border border-[#2c2c2c] bg-[#141414] rounded-md px-2 py-1 flex-row items-center">
                <Text className="text-[#A3A3A3] text-[14px] mr-2">{rowsPerPage}</Text>
                <Feather name="chevron-down" size={14} color="#FAFAFA" />
              </View>
            </View>
          </View>

          <View className="w-full border border-[#2c2c2c] bg-[#141414] rounded-2xl p-2 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View className="min-w-[500px]">
                
                <View className="flex-row border-b border-[#2c2c2c] pb-2 mb-2 px-2">
                  <Text className="text-white font-semibold text-[16px] w-[40px] text-center">No</Text>
                  <Text className="text-white font-semibold text-[16px] w-[100px] text-center">Date</Text>
                  <Text className="text-white font-semibold text-[16px] w-[180px] text-left pl-2">Courses</Text>
                  <Text className="text-white font-semibold text-[16px] w-[80px] text-center">Time</Text>
                </View>

                <View className="bg-black rounded-xl min-h-[120px] justify-center items-center">
                  {loading ? (
                    <ActivityIndicator size="small" color="#9457FF" />
                  ) : filteredLogs.length === 0 ? (
                    <Text className="text-[#A3A3A3] text-[14px] font-inter">No presence data found.</Text>
                  ) : (
                    filteredLogs.map((row, idx) => (
                      <View key={idx} className="flex-row px-2 py-3 border-b border-[#2c2c2c]">
                        <Text className="text-[#A3A3A3] text-[14px] w-[40px] text-center">{idx + 1}</Text>
                        <Text className="text-[#A3A3A3] text-[14px] w-[100px] text-center">{row.date}</Text>
                        <Text className="text-[#A3A3A3] text-[14px] w-[180px] text-left pl-2">{row.course}</Text>
                        <Text className="text-[#A3A3A3] text-[14px] w-[80px] text-center">{row.time}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>
          </View>

          <View className="w-full flex-row justify-between items-center py-2">
            <TouchableOpacity className="bg-[#141414] border border-[#2c2c2c] rounded px-3 py-1.5 opacity-50">
              <Text className="text-white text-[14px]">Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#141414] border border-[#2c2c2c] rounded px-3 py-1.5 opacity-50">
              <Text className="text-white text-[14px]">Next</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={popupMode !== null} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-[#15171A] border border-[#2c2c2c] w-[90%] max-w-[400px] rounded-2xl p-4">
            
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-inter text-[18px]">
                {popupMode === 'add' ? 'Log Presence' : 'Edit Presence'}
              </Text>
              <TouchableOpacity onPress={handleClosePopup}>
                <Feather name="x" size={24} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            <View className="bg-[#0f0f10] border border-[#2c2c2c] rounded-xl p-4">
              <Text className="text-white font-medium text-[16px] mb-1">{popupData?.course || popupData?.name || 'Course Name'}</Text>
              <Text className="text-[#A3A3A3] text-[14px] mb-4">{popupData?.room || '-'}</Text>

              <View className="flex-row gap-3 mb-5">
                <TouchableOpacity 
                  onPress={() => setStatusSelection('Present')}
                  className={`flex-row items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                    statusSelection === 'Present' ? 'bg-[#22C55E]/20 border-[#22C55E]/30' : 'bg-[#1b1b1b] border-[#2c2c2c]'
                  }`}
                >
                  <Text className={statusSelection === 'Present' ? 'text-[#4ADE80]' : 'text-zinc-300'}>Present</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setStatusSelection('Absent')}
                  className={`flex-row items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                    statusSelection === 'Absent' ? 'bg-[#EF4444]/20 border-[#EF4444]/30' : 'bg-[#1b1b1b] border-[#2c2c2c]'
                  }`}
                >
                  <Text className={statusSelection === 'Absent' ? 'text-[#F87171]' : 'text-zinc-300'}>Absent</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-[#A3A3A3] text-[14px] mb-2">Add Notes</Text>
              <TextInput 
                value={note}
                onChangeText={setNote}
                placeholder="Type notes..."
                placeholderTextColor="#6b7280"
                multiline
                className="w-full bg-transparent border border-[#2c2c2c] rounded-lg p-3 text-white h-[80px] text-top"
                style={{ textAlignVertical: 'top' }}
              />

              <TouchableOpacity 
                onPress={handleClosePopup}
                className="mt-6 self-end flex-row items-center gap-2 px-4 py-2 rounded-md"
                style={{ backgroundColor: '#9457FF' }}
              >
                <Text className="text-white font-inter text-[14px]">Submit Presence</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}