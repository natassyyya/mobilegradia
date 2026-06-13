import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreVertical, Pencil, Trash2, ArrowRightCircle, Plus, Check, X, AlertTriangle } from 'lucide-react-native';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useAuth } from '../../../hooks/use-auth';
import { useWorkspace } from '../../../hooks/use-workspace';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../../../api/workspacesApi';

export default function WorkspaceScreen() {
  const { user } = useAuth();
  const { setActiveWorkspace } = useWorkspace();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [addText, setAddText] = useState('');
  const [popupIndex, setPopupIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await getWorkspaces(user.id_user);
        if (data && Array.isArray(data)) {
          setWorkspaces(data);
        }
      } catch (err) {
        console.warn('API error loading workspaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, [user]);

  // Initial letters generator
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "GW";
  };

  // Add workspace
  const handleAdd = async () => {
    const name = addText.trim();
    if (!name) return;
    setLoadingAdd(true);
    try {
      if (user) {
        const data = await createWorkspace({
          id_user: user.id_user,
          name,
        });
        if (data && data[0]) {
          setWorkspaces((prev) => [...prev, data[0]]);
        }
      }
      setAddMode(false);
      setAddText('');
    } catch (error) {
      console.warn('Failed to create workspace on Supabase:', error);
    } finally {
      setLoadingAdd(false);
    }
  };

  // Edit workspace name
  const handleEdit = async (id_workspace: number) => {
    const name = editText.trim();
    if (!name) return;
    setLoadingAdd(true);
    try {
      await updateWorkspace(id_workspace, { name });
      setWorkspaces((prev) =>
        prev.map((w) => (w.id_workspace === id_workspace ? { ...w, name } : w))
      );
      setEditMode(null);
    } catch (error) {
      console.warn('Failed to update workspace on Supabase:', error);
    } finally {
      setLoadingAdd(false);
    }
  };

  // Delete workspace
  const handleDelete = async () => {
    if (!selectedWorkspace) return;
    setLoadingAdd(true);
    try {
      await deleteWorkspace(selectedWorkspace.id_workspace);
      setWorkspaces((prev) =>
        prev.filter((w) => w.id_workspace !== selectedWorkspace.id_workspace)
      );
      setShowDeleteAlert(false);
      setSelectedWorkspace(null);
    } catch (error) {
      console.warn('Failed to delete workspace on Supabase:', error);
    } finally {
      setLoadingAdd(false);
    }
  };

  // Enter workspace
  const enterWorkspace = async (idWorkspace: number, name: string) => {
    await setActiveWorkspace(idWorkspace, name);
    // Navigates directly to App Dashboard
    router.replace('/(app)/dashboard' as any);
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Background Bubbles from Web */}
      <View className="absolute inset-0 z-0 pointer-events-none bg-black">
        {/* Top Right Bubble */}
        <Image
          source={require('../../../../assets/images/login/bubble-1.png')}
          className="absolute top-0 right-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
        {/* Bottom Left Bubble */}
        <Image
          source={require('../../../../assets/images/login/bubble-2.png')}
          className="absolute bottom-0 left-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
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
          <View style={{ width: '100%', marginTop: 16 }}>
            <View style={{ paddingTop: 22, paddingBottom: 48, flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={{ fontSize: 36, color: '#FAFAFA', fontFamily: 'Genos-Bold', letterSpacing: 1.5 }}>
                <Text style={{ color: '#9457FF' }}>GRA</Text>DIA
              </Text>
            </View>
          </View>

          {/* Centered Wrapper */}
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 60 }}>
            {/* Welcome Title */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, color: 'white', textAlign: 'center', fontFamily: 'Montserrat-Bold', fontWeight: 'semibold', lineHeight: 38 }}>
                Welcome to{'\n'}Gradia Workspace
              </Text>
              <Text style={{ textAlign: 'center', color: '#A3A3A3', marginTop: 12, paddingHorizontal: 16, fontSize: 14, lineHeight: 20, fontFamily: 'Inter' }}>
                Your personal space to plan, grow, and achieve more.
              </Text>
            </View>

            {/* Workspaces List container */}
            <View
              style={styles.bodySection}
              className="flex-col w-full py-9 px-3 gap-3 rounded-[12px] mt-8 bg-white/5"
            >
            {loading ? (
              <View className="py-8 justify-center items-center">
                <ActivityIndicator size="large" color="#9457FF" />
                <Text className="text-[#A3A3A3] text-sm mt-3 font-inter">Loading workspaces...</Text>
              </View>
            ) : (
              <View className="flex-col gap-3">
                {workspaces.map((workspace, index) => (
                  <View
                    key={workspace.id_workspace || index}
                    style={{ zIndex: popupIndex === index ? 99 : 1 }}
                    className="flex-row p-3 bg-[#141414] rounded-[8px] justify-between items-center relative"
                  >
                    {editMode !== index ? (
                      <>
                        <View className="flex-row items-center gap-2 flex-1">
                          {/* More Options Button */}
                          <TouchableOpacity
                            onPress={() => setPopupIndex(popupIndex === index ? null : index)}
                            className="p-1"
                          >
                            <MoreVertical size={24} color="#FAFAFA" />
                          </TouchableOpacity>

                          {/* Initials Icon with LinearGradient */}
                          <LinearGradient
                            colors={['#141414', '#6a6a6a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              width: 42,
                              height: 35,
                              borderRadius: 4,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text className="font-semibold text-[15px] text-white font-inter">
                              {getInitials(workspace.name)}
                            </Text>
                          </LinearGradient>

                          {/* Workspace Name */}
                          <Text className="font-semibold text-white font-inter text-base ml-1 flex-1" numberOfLines={1}>
                            {workspace.name}
                          </Text>
                        </View>

                        {/* Enter Workspace Button matching Web gradient style */}
                        <TouchableOpacity
                          onPress={() => enterWorkspace(workspace.id_workspace, workspace.name)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#34146C', '#28073B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 8,
                              padding: 8,
                              paddingHorizontal: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ArrowRightCircle size={18} color="#FAFAFA" />
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Dropdown Menu Popup */}
                        {popupIndex === index && (
                          <View
                            style={[styles.popover, { zIndex: 100, elevation: 20 }]}
                            className="absolute bg-[#252424] p-4 flex flex-col gap-4 top-12 left-6 rounded-[12px] border border-white/10"
                          >
                            <TouchableOpacity
                              onPress={() => {
                                setPopupIndex(null);
                                setEditMode(index);
                                setEditText(workspace.name);
                              }}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                              className="pr-8"
                            >
                              <Pencil size={18} color="#FAFAFA" />
                              <Text className="text-white text-base font-inter">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                setPopupIndex(null);
                                setSelectedWorkspace(workspace);
                                setShowDeleteAlert(true);
                              }}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                              className="pr-8"
                            >
                              <Trash2 size={18} color="#F87171" />
                              <Text className="text-red-400 text-base font-inter">Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    ) : (
                      // Edit Mode Row
                      <View className="flex-row items-center gap-2 w-full">
                        <TextInput
                          value={editText}
                          onChangeText={setEditText}
                          placeholder="Edit workspace name"
                          placeholderTextColor="#A3A3A3"
                          autoFocus
                          onSubmitEditing={() => handleEdit(workspace.id_workspace)}
                          className="flex-1 text-white font-inter px-2 bg-[#333131]/50 rounded-[8px] h-[35px] border border-white/10"
                        />
                        <TouchableOpacity
                          onPress={() => setEditMode(null)}
                          className="bg-white/10 p-2 rounded-[8px]"
                        >
                          <X size={16} color="#FAFAFA" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEdit(workspace.id_workspace)}
                          disabled={loadingAdd}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#34146C', '#28073B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 8,
                              padding: 8,
                              paddingHorizontal: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {loadingAdd ? (
                              <ActivityIndicator size="small" color="#FAFAFA" />
                            ) : (
                              <Check size={20} color="#FAFAFA" />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add Workspace Row */}
                {workspaces.length < 3 && (
                  !addMode ? (
                    <View className="flex-row p-3 bg-[#141414] rounded-[8px] items-center">
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => setAddMode(true)}
                          activeOpacity={0.7}
                          className="w-[42px] h-[32px] items-center justify-center bg-[#393939] rounded-[4px]"
                        >
                          <Plus size={24} color="#FAFAFA" />
                        </TouchableOpacity>
                        <Text className="font-semibold font-inter text-[#A3A3A3] ml-1">
                          Create new workspace
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row p-3 bg-[#333131]/50 rounded-[8px] items-center justify-between w-full h-[64px] gap-2 border border-white/5">
                      <TextInput
                        value={addText}
                        onChangeText={setAddText}
                        placeholder="Your workspace's name"
                        placeholderTextColor="#A3A3A3"
                        autoFocus
                        onSubmitEditing={handleAdd}
                        className="flex-1 text-white font-inter px-2 bg-[#333131]/50 rounded-[8px] h-[40px]"
                      />
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => {
                            setAddMode(false);
                            setAddText('');
                          }}
                          className="bg-white/10 p-2 rounded-[8px]"
                        >
                          <X size={16} color="#FAFAFA" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleAdd}
                          disabled={loadingAdd}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#34146C', '#28073B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 8,
                              padding: 8,
                              paddingHorizontal: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {loadingAdd ? (
                              <ActivityIndicator size="small" color="#FAFAFA" />
                            ) : (
                              <Plus size={20} color="#FAFAFA" />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Delete */}
      {showDeleteAlert && selectedWorkspace && (
        <View style={styles.modalOverlay} className="absolute inset-0 bg-black/70 justify-center items-center z-[99]">
          <View className="px-4 py-5 bg-[#15171A] gap-5 rounded-2xl w-[85%] max-w-[400px] border border-white/10">
            <Text className="font-semibold text-white text-[20px] text-center font-montserrat">
              Delete Workspace
            </Text>
            
            <View className="px-4 py-4 w-full items-center gap-4 bg-gradient-to-t from-[#141414] to-[#070707] rounded-[12px] border border-white/5">
              <View className="w-[80px] h-[80px] items-center justify-center">
                <AlertTriangle size={80} color="#E13030" />
              </View>
              
              <Text className="font-semibold text-white text-center font-montserrat px-2 text-base">
                Are you sure you want to delete this workspace?
              </Text>
              <Text className="text-center text-[#A3A3A3] text-sm font-inter px-2 leading-relaxed">
                This action cannot be undone, and all related data will be permanently removed.
              </Text>

              <View className="border-t border-white/10 pt-4 flex-row justify-end w-full gap-6 mt-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowDeleteAlert(false);
                    setSelectedWorkspace(null);
                  }}
                  className="px-3 py-2 bg-[#6b7280]/20 rounded-[8px]"
                >
                  <Text className="text-white font-semibold font-inter">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={loadingAdd}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  className="px-3 py-2 bg-[#EF4444]/20 rounded-[8px] flex-row items-center"
                >
                  <Text className="text-[#F87171] font-semibold font-inter">Delete</Text>
                  {loadingAdd ? (
                    <ActivityIndicator size="small" color="#F87171" style={{ marginLeft: 4 }} />
                  ) : (
                    <Trash2 size={18} color="#F87171" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bodySection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  popover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});
