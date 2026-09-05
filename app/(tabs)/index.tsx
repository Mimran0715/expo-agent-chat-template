import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { MessageList } from '@/components/chat/message-list';
import { INITIAL_CONVERSATIONS, NEW_CHAT_MESSAGES, type Conversation } from '@/constants/chat';
import { streamChatResponse } from '@/services/chat';

export default function ChatScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(INITIAL_CONVERSATIONS[0].id);
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const activeConversation = conversations.find(({ id }) => id === activeConversationId) ?? conversations[0];

  useEffect(() => () => abortController.current?.abort(), []);

  async function handleSend(content: string) {
    if (streamingConversationId) {
      if (__DEV__) console.log('[CHAT] send.ignored', { reason: 'response_in_progress' });
      return;
    }
    const conversationId = activeConversationId;
    const startedAt = Date.now();
    if (__DEV__) console.log('[CHAT] send.started', { conversationId, inputCharacters: content.length });
    const userMessage = { id: `message-${Date.now()}-user`, role: 'user' as const, content };
    const assistantMessage = { id: `message-${Date.now()}-assistant`, role: 'assistant' as const, content: '' };
    const requestMessages = [...activeConversation.messages, userMessage];

    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      const isUntitled = conversation.title === 'New conversation';
      return {
        ...conversation,
        title: isUntitled ? content.slice(0, 32) : conversation.title,
        preview: content,
        updatedAt: 'Now',
        messages: [...conversation.messages, userMessage, assistantMessage],
      };
    }));
    if (__DEV__) console.log('[CHAT] ui.thinking', { conversationId });

    const controller = new AbortController();
    abortController.current = controller;
    setStreamingConversationId(conversationId);

    try {
      if (__DEV__) console.log('[CHAT] stream.calling', { conversationId });
      await streamChatResponse(requestMessages, (token) => {
        setConversations((current) => current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                preview: `${conversation.messages.at(-1)?.content ?? ''}${token}`,
                messages: conversation.messages.map((message) =>
                  message.id === assistantMessage.id ? { ...message, content: message.content + token } : message,
                ),
              }
            : conversation,
        ));
      }, controller.signal);
      if (__DEV__) console.log('[CHAT] ui.response_completed', {
        conversationId,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        if (__DEV__) console.error('[CHAT] ui.response_failed', {
          conversationId,
          durationMs: Date.now() - startedAt,
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        const message = error instanceof Error ? error.message : 'Unable to reach the model.';
        setConversations((current) => current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                preview: 'Response failed',
                messages: conversation.messages.map((item) =>
                  item.id === assistantMessage.id
                    ? { ...item, content: `Sorry, I couldn't generate a response. ${message}` }
                    : item,
                ),
              }
            : conversation,
          ));
      } else if (__DEV__) {
        console.log('[CHAT] ui.response_aborted', {
          conversationId,
          durationMs: Date.now() - startedAt,
        });
      }
    } finally {
      if (abortController.current === controller) abortController.current = null;
      setStreamingConversationId((current) => current === conversationId ? null : current);
      if (__DEV__) console.log('[CHAT] send.finished', {
        conversationId,
        durationMs: Date.now() - startedAt,
      });
    }
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
          <MessageList key={activeConversation.id} messages={activeConversation.messages}
            streaming={streamingConversationId === activeConversation.id} />
          <ChatComposer disabled={streamingConversationId !== null} onSend={handleSend} />
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
