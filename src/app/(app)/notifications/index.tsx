import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { ScreenContainer } from '../../../components/layout/screen-container';
import { useNotifications } from '../../../hooks/use-notifications';
import { Bell, CheckCheck, Clock, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom self-contained Swipe-to-Delete Card Container
function SwipeableCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Trigger horizontal swipe right gesture
        return Math.abs(gestureState.dx) > 10 && gestureState.dx > 0 && Math.abs(gestureState.dy) < 8;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = SCREEN_WIDTH * 0.35;
        if (gestureState.dx > threshold) {
          // Swipe complete - slide off screen to the right
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            onDelete();
          });
        } else {
          // Swipe cancelled - spring back to center
          Animated.spring(translateX, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const bgOpacity = translateX.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{ opacity }}>
      <View style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 12 }}>
        
        {/* Background Delete View (Red) */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: SCREEN_WIDTH,
            backgroundColor: '#EF4444',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 20,
            opacity: bgOpacity,
            zIndex: 1
          }}
        >
          <Trash2 size={16} color="#FAFAFA" />
          <Text style={{ color: '#FAFAFA', fontWeight: 'bold', fontSize: 13, fontFamily: 'Montserrat-Bold', marginLeft: 8 }}>
            Delete
          </Text>
        </Animated.View>

        {/* Foreground Content Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateX }],
            backgroundColor: '#000',
            zIndex: 2
          }}
        >
          {children}
        </Animated.View>

      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    unreadCount, 
    deleteNotification, 
    deleteAllNotifications 
  } = useNotifications();

  const formatDateHeader = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    if (priority === 'High') return '#EF4444'; // Red
    if (priority === 'Medium') return '#EAB308'; // Yellow
    return '#3B82F6'; // Blue for Low
  };

  // Group notifications by date header (ignoring flagged deleted ones)
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    notifications.forEach((item) => {
      if (item.deleted) return;
      const dateStr = formatDateHeader(item.createdAt);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });
    return groups;
  }, [notifications]);

  // Sort dates: newest first
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedNotifications]);

  const visibleNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.deleted).length;
  }, [notifications]);

  const hasVisibleNotifications = visibleNotificationsCount > 0;

  return (
    <ScreenContainer useSafeArea={true} style={{ paddingHorizontal: 0, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Title Section */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FAFAFA', fontFamily: 'Montserrat-Bold' }}>
            Notifications
          </Text>
          
          <Text style={{ color: '#A3A3A3', marginTop: 8, fontSize: 14, lineHeight: 20, fontFamily: 'Inter' }}>
            Get timely reminders about upcoming assignment deadlines.
          </Text>

          {/* Subheader Row: Badges and Action buttons rearranged */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            {/* Left side: New Notification Count Badge */}
            <View>
              {unreadCount > 0 ? (
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: '#FAFAFA', fontSize: 10, fontWeight: 'bold', fontFamily: 'Inter' }}>
                    {unreadCount} New
                  </Text>
                </View>
              ) : (
                <View />
              )}
            </View>

            {/* Right side: Read All & Trash buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 && (
                <TouchableOpacity 
                  onPress={markAllAsRead}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#1b1b1b',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8
                  }}
                >
                  <CheckCheck size={14} color="#9457FF" />
                  <Text style={{ color: '#FAFAFA', fontSize: 12, fontWeight: '600', fontFamily: 'Inter' }}>Read All</Text>
                </TouchableOpacity>
              )}

              {hasVisibleNotifications && (
                <TouchableOpacity 
                  onPress={deleteAllNotifications}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#1b1b1b',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    padding: 8,
                    borderRadius: 8
                  }}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Notifications list grouped by date */}
        <View style={{ flexDirection: 'column' }}>
          {sortedDateKeys.map((dateKey) => (
            <View key={dateKey} style={{ flexDirection: 'column' }}>
              {/* Date Separator Header with Brighter Line */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#E4E4E7', fontFamily: 'Montserrat-Bold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {dateKey}
                </Text>
                <View style={{ flex: 1, height: 1, marginLeft: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
              </View>

              {/* List of cards for this date */}
              <View style={{ flexDirection: 'column', gap: 12 }}>
                {groupedNotifications[dateKey].map((item) => {
                  const isUnread = !item.read;

                  return (
                    <SwipeableCard
                      key={item.id}
                      onDelete={() => deleteNotification(item.id)}
                    >
                      <TouchableOpacity
                        onPress={() => markAsRead(item.id)}
                        activeOpacity={0.8}
                        style={{
                          width: '100%',
                          borderRadius: 12,
                          borderWidth: 1,
                          padding: 12,
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 12,
                          position: 'relative',
                          overflow: 'hidden',
                          backgroundColor: isUnread ? 'rgba(148, 87, 255, 0.08)' : '#111111',
                          borderColor: isUnread ? 'rgba(148, 87, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {/* Left glow line for unread notifications */}
                        {isUnread && (
                          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#9457FF' }} />
                        )}

                        {/* Priority Dot - aligned perfectly with the first line of the task name */}
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: getPriorityColor(item.priority),
                          marginTop: 5,
                          marginLeft: 2,
                        }} />

                        <View style={{ flex: 1, flexDirection: 'column', gap: 4 }}>
                          {/* Task Title (Can wrap to 2 lines if needed) */}
                          <Text style={{
                            fontSize: 14,
                            fontFamily: 'Montserrat-Bold',
                            fontWeight: 'bold',
                            color: isUnread ? '#FFFFFF' : '#A3A3A3',
                            lineHeight: 18
                          }}>
                            {item.taskName}
                          </Text>

                          {/* Course Name */}
                          <Text style={{
                            color: '#A3A3A3',
                            fontSize: 12,
                            fontFamily: 'Inter'
                          }} numberOfLines={1}>
                            {item.courseName}
                          </Text>

                          {/* Clock icon and Time Left (aligned to the left) */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Clock size={12} color={isUnread ? '#C084FC' : '#71717A'} />
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '600',
                              fontFamily: 'Inter',
                              color: isUnread ? '#C084FC' : '#9E9E9E'
                            }}>
                              {item.timeLeft}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </SwipeableCard>
                  );
                })}
              </View>
            </View>
          ))}

          {!hasVisibleNotifications && (
            <LinearGradient
              colors={['#141414', '#070707']}
              style={{
                width: '100%',
                height: 200,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(44, 44, 44, 0.5)',
                borderRadius: 12,
                marginTop: 24
              }}
            >
              <Bell size={36} color="#4B5563" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#A3A3A3', fontFamily: 'Inter', fontSize: 14 }}>
                No notification history available.
              </Text>
            </LinearGradient>
          )}
        </View>
        
      </ScrollView>
    </ScreenContainer>
  );
}
