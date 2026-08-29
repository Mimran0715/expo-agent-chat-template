import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { MessageList } from '@/components/chat/message-list';
import { INITIAL_CONVERSATIONS, NEW_CHAT_MESSAGES, type Conversation } from '@/constants/chat';

export default function ChatScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(INITIAL_CONVERSATIONS[0].id);
  const activeConversation = conversations.find(({ id }) => id === activeConversationId) ?? conversations[0];

  function handleSend(content: string) {
    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== activeConversationId) return conversation;
      const isUntitled = conversation.title === 'New conversation';
      return {
        ...conversation,
        title: isUntitled ? content.slice(0, 32) : conversation.title,
        preview: content,
        updatedAt: 'Now',
        messages: [...conversation.messages, { id: `message-${Date.now()}`, role: 'user', content }],
      };
    }));
  }

  function handleNewChat() {
    const id = `conversation-${Date.now()}`;
    const conversation: Conversation = {
      id,
      title: 'New conversation',
      preview: 'Start a new conversation',
      updatedAt: 'Now',
      messages: NEW_CHAT_MESSAGES.map((message) => ({ ...message, id: `${message.id}-${id}` })),
    };
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  }

  function handleSelectChat(id: string) {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <ChatHeader title={activeConversation.title} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <View style={styles.content}>
          <MessageList key={activeConversation.id} messages={activeConversation.messages} />
          <ChatComposer onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
      <ChatSidebar
        activeConversationId={activeConversationId}
        conversations={conversations}
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8F5' },
  screen: { flex: 1 },
  content: { flex: 1 },
});
