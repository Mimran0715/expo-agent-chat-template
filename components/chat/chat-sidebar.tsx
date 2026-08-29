import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountModal } from '@/components/account/account-modal';
import type { Conversation } from '@/constants/chat';
import { IconButton } from './icon-button';

type Props = {
  activeConversationId: string;
  conversations: Conversation[];
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
};

export function ChatSidebar({
  activeConversationId,
  conversations,
  open,
  onClose,
  onNewChat,
  onSelectChat,
}: Props) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [accountModal, setAccountModal] = useState<'profile' | 'settings' | null>(null);

  function closeSidebar() {
    setIsProfileMenuOpen(false);
    setAccountModal(null);
    onClose();
  }

  function openAccountModal(mode: 'profile' | 'settings') {
    setIsProfileMenuOpen(false);
    setAccountModal(mode);
  }

  return (
    <Modal animationType="fade" onRequestClose={closeSidebar} transparent visible={open}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.drawer} edges={['top', 'bottom', 'left']}>
          <View style={styles.drawerHeader}>
            <Text style={styles.brand}>Agent Chat</Text>
            <IconButton name="close" accessibilityLabel="Close conversations" onPress={closeSidebar} />
          </View>
          <Text style={styles.sectionLabel}>RECENT</Text>
          <ScrollView contentContainerStyle={styles.conversations} style={styles.conversationList}>
            {conversations.map((conversation) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: conversation.id === activeConversationId }}
                key={conversation.id}
                onPress={() => onSelectChat(conversation.id)}
                style={[styles.conversation, conversation.id === activeConversationId && styles.activeConversation]}>
                <View style={styles.conversationCopy}>
                  <Text numberOfLines={1} style={styles.conversationTitle}>{conversation.title}</Text>
                  <Text numberOfLines={1} style={styles.preview}>{conversation.preview}</Text>
                </View>
                <Text style={styles.time}>{conversation.updatedAt}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" style={styles.newChat} onPress={onNewChat}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newChatText}>New Chat</Text>
          </Pressable>
          {isProfileMenuOpen && (
            <View style={styles.profileMenu}>
              <Pressable onPress={() => openAccountModal('profile')} style={styles.menuItem}>
                <Ionicons name="person-outline" size={19} color="#3D443D" />
                <Text style={styles.menuItemText}>View profile</Text>
              </Pressable>
              <Pressable onPress={() => openAccountModal('settings')} style={styles.menuItem}>
                <Ionicons name="settings-outline" size={19} color="#3D443D" />
                <Text style={styles.menuItemText}>Settings</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable onPress={() => Alert.alert('Sign out', 'Connect this action to your authentication provider.')} style={styles.menuItem}>
                <Ionicons name="log-out-outline" size={19} color="#A23B36" />
                <Text style={[styles.menuItemText, styles.signOutText]}>Sign out</Text>
              </Pressable>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isProfileMenuOpen }}
            onPress={() => setIsProfileMenuOpen((current) => !current)}
            style={[styles.profile, isProfileMenuOpen && styles.profileActive]}>
            <View style={styles.profileAvatar}><Text style={styles.initials}>JD</Text></View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>Jordan Davis</Text>
              <Text style={styles.profileHint}>Profile & settings</Text>
            </View>
            <Ionicons name={isProfileMenuOpen ? 'chevron-down' : 'chevron-forward'} size={18} color="#899088" />
          </Pressable>
        </SafeAreaView>
        <Pressable accessibilityLabel="Close conversations" onPress={closeSidebar} style={styles.dismissArea} />
        <AccountModal mode="profile" onClose={() => setAccountModal(null)} visible={accountModal === 'profile'} />
        <AccountModal mode="settings" onClose={() => setAccountModal(null)} visible={accountModal === 'settings'} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(22, 28, 24, 0.42)', flex: 1, flexDirection: 'row' },
  drawer: { backgroundColor: '#F7F8F5', maxWidth: 360, paddingHorizontal: 16, position: 'relative', width: '86%' },
  dismissArea: { flex: 1 },
  drawerHeader: { alignItems: 'center', flexDirection: 'row', height: 58, justifyContent: 'space-between' },
  brand: { color: '#20241F', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  newChat: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#315C45', borderRadius: 13, flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: 18, paddingVertical: 12 },
  newChatText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionLabel: { color: '#899088', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 8 },
  conversationList: { flex: 1 },
  conversations: { gap: 4, paddingBottom: 12 },
  profileMenu: { backgroundColor: '#FFFFFF', borderColor: '#E0E3DD', borderRadius: 14, borderWidth: 1, bottom: 76, elevation: 6, left: 16, padding: 6, position: 'absolute', right: 16, shadowColor: '#111811', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, zIndex: 2 },
  menuItem: { alignItems: 'center', borderRadius: 9, flexDirection: 'row', gap: 11, minHeight: 44, paddingHorizontal: 11 },
  menuItemText: { color: '#3D443D', fontSize: 14, fontWeight: '600' },
  menuDivider: { backgroundColor: '#E8EAE5', height: StyleSheet.hairlineWidth, marginVertical: 4 },
  signOutText: { color: '#A23B36' },
  conversation: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 8, padding: 12 },
  activeConversation: { backgroundColor: '#E7ECE6' },
  conversationCopy: { flex: 1, gap: 3 },
  conversationTitle: { color: '#2B302B', fontSize: 15, fontWeight: '600' },
  preview: { color: '#777F77', fontSize: 13 },
  time: { color: '#899088', fontSize: 12 },
  profile: { alignItems: 'center', borderTopColor: '#E0E3DD', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 11, paddingVertical: 16 },
  profileActive: { backgroundColor: '#EDF0EB' },
  profileAvatar: { alignItems: 'center', backgroundColor: '#D9E4DA', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  initials: { color: '#315C45', fontSize: 13, fontWeight: '800' },
  profileCopy: { flex: 1, gap: 2 },
  profileName: { color: '#262B26', fontSize: 14, fontWeight: '700' },
  profileHint: { color: '#7D857D', fontSize: 12 },
});
