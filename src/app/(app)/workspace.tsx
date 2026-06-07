import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/screen-container';

export default function WorkspacesScreen() {
  const router = useRouter();
  
  // === STATE MANAGEMENT ===
  // Menggunakan data dummy awal agar UI langsung terlihat
  const [workspaces, setWorkspaces] = useState([
    { id_workspace: '1', name: 'Personal Goals' },
    { id_workspace: '2', name: 'Kuliah Semester 6' }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [addMode, setAddMode] = useState(false);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);
  const [inputText, setInputText] = useState(''); // Pengganti useRef untuk input add/edit
  
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // === FUNGSI AKSI ===
  const handleAdd = () => {
    if (!inputText.trim()) return;
    setLoadingAction(true);
    
    // Simulasi API POST
    setTimeout(() => {
      const newWorkspace = { id_workspace: Date.now().toString(), name: inputText };
      setWorkspaces([...workspaces, newWorkspace]);
      setAddMode(false);
      setInputText('');
      setLoadingAction(false);
    }, 1000);
  };

  const handleEdit = (id_workspace: string) => {
    if (!inputText.trim()) return;
    setLoadingAction(true);

    // Simulasi API PUT
    setTimeout(() => {
      setWorkspaces(prev => 
        prev.map(w => w.id_workspace === id_workspace ? { ...w, name: inputText } : w)
      );
      setEditMode(null);
      setInputText('');
      setLoadingAction(false);
    }, 1000);
  };

  const handleDelete = () => {
    if (!selectedWorkspace) return;
    setLoadingAction(true);

    // Simulasi API DELETE
    setTimeout(() => {
      setWorkspaces(prev => prev.filter(w => w.id_workspace !== selectedWorkspace.id_workspace));
      setShowDeleteAlert(false);
      setSelectedWorkspace(null);
      setLoadingAction(false);
    }, 1000);
  };

  const enterWorkspace = (idWorkspace: string) => {
    // Di mobile, kita tidak pakai sessionStorage. 
    // Bisa pakai AsyncStorage (nanti), atau lempar via parameter router.
    console.log("Entering Workspace ID:", idWorkspace);
    router.push('/(app)/dashboard'); 
  };

  const closeAllMenus = () => {
    setPopupIndex(null);
  };

  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0 }}>
      {/* Background Effect */}
      <View className="absolute inset-0 z-0 bg-black" pointerEvents="none">
        <Image
          source={require('../../../assets/images/login/bubble-1.png')}
          className="absolute top-0 right-0 w-[280px] h-[280px] opacity-70"
          resizeMode="contain"
        />
      </View>

      {/* Trik untuk menutup dropdown saat tap area kosong */}
      <TouchableWithoutFeedback onPress={closeAllMenus}>
        <View style={{ flex: 1 }}>
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 20 }}>
              
              {/* === HEADER === */}
              <View className="w-full mt-6 flex-row justify-start">
                <Text className="text-2xl font-extrabold tracking-wider text-white font-genos">
                  <Text className="text-[#9457FF]">GRA</Text>DIA
                </Text>
              </View>

              <View className="items-center mt-8">
                <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                  Welcome to{'\n'}Gradia Workspace
                </Text>
                <Text className="text-center text-[#A3A3A3] mt-3 text-sm leading-5 font-inter px-4">
                  Your personal space to plan, grow, and achieve more.
                </Text>
              </View>

              {/* === BODY SECTION === */}
              <View className="flex-1 bg-white/5 rounded-[12px] p-4 mt-8 border border-white/10 shadow-lg">
                {loading ? (
                  <ActivityIndicator size="large" color="#9457FF" className="my-10" />
                ) : (
                  <View className="flex-col gap-4">
                    
                    {/* LIST WORKSPACE */}
                    {workspaces.map((workspace, index) => (
                      <View key={workspace.id_workspace} className="flex-row p-4 bg-[#141414] rounded-lg justify-between items-center z-10 relative">
                        
                        {/* Jika Sedang Mode Edit */}
                        {editMode === index ? (
                          <View className="flex-row items-center gap-2 flex-1">
                            <TextInput
                              value={inputText}
                              onChangeText={setInputText}
                              placeholder="Edit workspace name"
                              placeholderTextColor="#6b7280"
                              autoFocus
                              onSubmitEditing={() => handleEdit(workspace.id_workspace)}
                              className="flex-1 bg-[#333131]/50 text-white px-3 py-2 rounded-md font-inter h-[40px]"
                            />
                            <TouchableOpacity 
                              onPress={() => handleEdit(workspace.id_workspace)}
                              className="w-[40px] h-[40px] bg-[#9457FF]/20 rounded-md items-center justify-center border border-[#9457FF]/50"
                            >
                              {loadingAction ? <ActivityIndicator size="small" color="#9457FF"/> : <Feather name="check" size={20} color="#9457FF" />}
                            </TouchableOpacity>
                          </View>
                        ) : (
                          // Mode Normal
                          <>
                            <View className="flex-row items-center gap-3 flex-1">
                              {/* Titik 3 (Dropdown Menu) */}
                              <TouchableOpacity onPress={() => setPopupIndex(popupIndex === index ? null : index)}>
                                <Feather name="more-vertical" size={24} color="#FAFAFA" />
                              </TouchableOpacity>

                              {/* Ikon Inisial Nama */}
                              <LinearGradient
                                colors={['#6a6a6a', '#141414']}
                                style={{ width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Text className="text-white font-bold text-sm">
                                  {workspace.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </Text>
                              </LinearGradient>
                              
                              <Text className="text-white font-semibold flex-1 ml-1" numberOfLines={1}>
                                {workspace.name}
                              </Text>
                            </View>

                            {/* Tombol Enter */}
                            <TouchableOpacity 
                              onPress={() => enterWorkspace(workspace.id_workspace)}
                              className="w-[40px] h-[40px] bg-white/10 rounded-md items-center justify-center"
                            >
                              <Feather name="log-in" size={18} color="#FAFAFA" />
                            </TouchableOpacity>

                            {/* POPUP MENU (Muncul saat titik 3 ditekan) */}
                            {popupIndex === index && (
                              <View className="absolute top-[50px] left-[10px] bg-[#252424] rounded-xl p-3 w-[140px] border border-white/10 z-50 shadow-2xl">
                                <TouchableOpacity 
                                  className="flex-row items-center gap-3 py-2 border-b border-white/5"
                                  onPress={() => {
                                    setPopupIndex(null);
                                    setEditMode(index);
                                    setInputText(workspace.name);
                                  }}
                                >
                                  <Feather name="edit" size={18} color="#FAFAFA" />
                                  <Text className="text-white font-inter">Edit</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                  className="flex-row items-center gap-3 py-2 mt-1"
                                  onPress={() => {
                                    setPopupIndex(null);
                                    setSelectedWorkspace(workspace);
                                    setShowDeleteAlert(true);
                                  }}
                                >
                                  <Ionicons name="trash-outline" size={18} color="#F87171" />
                                  <Text className="text-[#F87171] font-inter">Delete</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    ))}

                    {/* === BAGIAN ADD WORKSPACE === */}
                    {workspaces.length < 3 && (
                      !addMode ? (
                        // Tombol Tambah
                        <TouchableOpacity 
                          onPress={() => { setAddMode(true); setInputText(''); setEditMode(null); closeAllMenus(); }}
                          className="flex-row p-4 bg-[#141414] rounded-lg items-center gap-3"
                        >
                          <View className="w-[40px] h-[40px] bg-[#393939] rounded-md items-center justify-center">
                            <Feather name="plus" size={24} color="#FAFAFA" />
                          </View>
                          <Text className="text-[#A3A3A3] font-semibold">Create new workspace</Text>
                        </TouchableOpacity>
                      ) : (
                        // Input Tambah
                        <View className="flex-row p-4 bg-[#333131]/50 rounded-lg justify-between items-center border border-white/10">
                          <TextInput
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Your workspace's name"
                            placeholderTextColor="#6b7280"
                            autoFocus
                            onSubmitEditing={handleAdd}
                            className="flex-1 text-white font-inter h-[40px]"
                          />
                          <TouchableOpacity 
                            onPress={handleAdd}
                            className="w-[40px] h-[40px] bg-white/10 rounded-md items-center justify-center"
                          >
                            {loadingAction ? <ActivityIndicator size="small" color="#FAFAFA"/> : <Feather name="plus" size={20} color="#FAFAFA" />}
                          </TouchableOpacity>
                        </View>
                      )
                    )}

                  </View>
                )}
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      {/* === MODAL DELETE CONFIRMATION === */}
      <Modal visible={showDeleteAlert} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-[#15171A] w-full max-w-[400px] rounded-2xl p-5 border border-white/10">
            <Text className="text-white font-bold text-xl text-center mb-4">Delete Workspace</Text>
            
            <LinearGradient colors={['#141414', '#070707']} className="rounded-xl p-5 items-center border border-white/5">
              <Ionicons name="warning-outline" size={60} color="#FDE047" className="mb-4" />
              <Text className="text-white font-semibold text-center text-lg mb-2">
                Are you sure you want to delete this workspace?
              </Text>
              <Text className="text-[#A3A3A3] text-center text-sm mb-6 leading-5">
                This action cannot be undone, and all related data will be permanently removed.
              </Text>

              <View className="flex-row justify-end w-full gap-3 pt-4 border-t border-white/10">
                <TouchableOpacity 
                  onPress={() => { setShowDeleteAlert(false); setSelectedWorkspace(null); }}
                  className="px-4 py-2 bg-[#6b7280]/20 rounded-lg"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDelete}
                  className="px-4 py-2 bg-[#EF4444]/20 rounded-lg flex-row items-center gap-2"
                >
                  <Text className="text-[#F87171] font-medium">Delete</Text>
                  {loadingAction ? <ActivityIndicator size="small" color="#F87171"/> : <Ionicons name="trash" size={16} color="#F87171" />}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}