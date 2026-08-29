import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { IconButton } from './icon-button';

export function ChatComposer({ onSend }: { onSend: (message: string) => void }) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;
  function submit() { if (canSend) { onSend(draft.trim()); setDraft(''); } }

  return (
    <View style={styles.wrapper}>
      <View style={styles.composer}>
        <IconButton name="add" accessibilityLabel="Add attachment" color="#667067" />
        <TextInput accessibilityLabel="Message" multiline onChangeText={setDraft} onSubmitEditing={submit}
          placeholder="Message Assistant" placeholderTextColor="#8A918A" returnKeyType="send" style={styles.input} value={draft} />
        <Pressable accessibilityLabel="Send message" disabled={!canSend} onPress={submit}
          style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}>
          <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#F7F8F5', paddingBottom: 12, paddingHorizontal: 14, paddingTop: 8 },
  composer: { alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderColor: '#DEE1DA', borderRadius: 25, borderWidth: 1, flexDirection: 'row', minHeight: 52, padding: 3 },
  input: { color: '#20241F', flex: 1, fontSize: 16, lineHeight: 21, maxHeight: 120, minHeight: 44, paddingHorizontal: 4, paddingVertical: 11 },
  send: { alignItems: 'center', backgroundColor: '#315C45', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  sendDisabled: { backgroundColor: '#B8BDB7' },
  pressed: { opacity: 0.7 },
});
