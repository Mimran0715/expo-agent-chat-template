import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import Markdown from 'react-native-markdown-display';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '@/constants/chat';

export function MessageList({ messages, streaming = false }: { messages: ChatMessage[]; streaming?: boolean }) {
  const list = useRef<FlatList<ChatMessage>>(null);

  return (
    <FlatList ref={list} contentContainerStyle={styles.content} data={messages} keyExtractor={(item) => item.id}
      onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
      renderItem={({ item }) => (
        <View style={[styles.row, item.role === 'user' && styles.userRow]}>
          {item.role === 'assistant' && <View style={styles.avatar}><Ionicons name="sparkles" size={16} color="#FFFFFF" /></View>}
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            {item.role === 'assistant' && item.content ? (
              <Markdown style={markdownStyles}>{item.content}</Markdown>
            ) : (
              <Text style={[styles.message, item.role === 'user' && styles.userMessage]}>
                {item.content || (streaming && item === messages[messages.length - 1] ? 'Thinking…' : '')}
              </Text>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 22, justifyContent: 'flex-end', paddingHorizontal: 18, paddingVertical: 28 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  userRow: { justifyContent: 'flex-end' },
  avatar: { alignItems: 'center', backgroundColor: '#315C45', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  bubble: { borderRadius: 20, maxWidth: '82%', paddingHorizontal: 16, paddingVertical: 12 },
  assistantBubble: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: '#315C45', borderTopRightRadius: 6 },
  message: { color: '#30342F', fontSize: 16, lineHeight: 23 },
  userMessage: { color: '#FFFFFF' },
});

const markdownStyles = StyleSheet.create({
  body: { color: '#30342F', fontSize: 16, lineHeight: 23 },
  paragraph: { marginBottom: 8, marginTop: 0 },
  heading1: { fontSize: 24, lineHeight: 30, marginBottom: 8, marginTop: 0 },
  heading2: { fontSize: 21, lineHeight: 27, marginBottom: 8, marginTop: 0 },
  heading3: { fontSize: 18, lineHeight: 24, marginBottom: 6, marginTop: 0 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  code_inline: { backgroundColor: '#EEF1ED', color: '#263B30' },
  code_block: { backgroundColor: '#EEF1ED', borderColor: '#D8DED9', color: '#263B30' },
  fence: { backgroundColor: '#EEF1ED', borderColor: '#D8DED9', color: '#263B30' },
  blockquote: { backgroundColor: '#F4F6F3', borderColor: '#8BA596' },
  link: { color: '#315C45' },
});
