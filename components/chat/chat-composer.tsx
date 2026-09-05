import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ImageAttachment } from '@/constants/chat';
import { IconButton } from './icon-button';

type Props = {
  disabled?: boolean;
  onSend: (message: string, image?: ImageAttachment) => void;
};

export function ChatComposer({ disabled = false, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState<ImageAttachment>();
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const canSend = (draft.trim().length > 0 || image) && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(draft.trim(), image);
    setDraft('');
    setImage(undefined);
  }

  async function attach(source: 'camera' | 'library') {
    setAttachmentMenuOpen(false);
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        `Allow photo ${source === 'camera' ? 'camera' : 'library'} access to attach an image.`,
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Image unavailable', 'The selected image could not be read. Please choose another image.');
      return;
    }
    setImage({
      dataUrl: `data:image/jpeg;base64,${asset.base64}`,
      height: asset.height,
      uri: asset.uri,
      width: asset.width,
    });
  }

  return (
    <View style={styles.wrapper}>
      {image && (
        <View style={styles.previewRow}>
          <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
          <Pressable accessibilityLabel="Remove attached image" onPress={() => setImage(undefined)} style={styles.remove}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
      <View style={styles.composer}>
        <IconButton name="add" accessibilityLabel="Add image" color="#667067"
          disabled={disabled} onPress={() => setAttachmentMenuOpen(true)} />
        <TextInput accessibilityLabel="Message" editable={!disabled} multiline onChangeText={setDraft} onSubmitEditing={submit}
          placeholder="Message Assistant" placeholderTextColor="#8A918A" returnKeyType="send" style={styles.input} value={draft} />
        <Pressable accessibilityLabel="Send message" disabled={!canSend} onPress={submit}
          style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}>
          <Ionicons name="arrow-up" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
      <Modal animationType="fade" transparent visible={attachmentMenuOpen}
        onRequestClose={() => setAttachmentMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAttachmentMenuOpen(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Add an image</Text>
            <Pressable style={styles.menuItem} onPress={() => attach('camera')}>
              <Ionicons name="camera-outline" size={22} color="#315C45" /><Text style={styles.menuText}>Take photo</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => attach('library')}>
              <Ionicons name="images-outline" size={22} color="#315C45" /><Text style={styles.menuText}>Choose from library</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#F7F8F5', paddingBottom: 12, paddingHorizontal: 14, paddingTop: 8 },
  previewRow: { alignSelf: 'flex-start', marginBottom: 8, position: 'relative' },
  preview: { borderRadius: 12, height: 88, width: 88 },
  remove: { alignItems: 'center', backgroundColor: '#30342F', borderRadius: 12, height: 24, justifyContent: 'center', position: 'absolute', right: -7, top: -7, width: 24 },
  composer: { alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderColor: '#DEE1DA', borderRadius: 25, borderWidth: 1, flexDirection: 'row', minHeight: 52, padding: 3 },
  input: { color: '#20241F', flex: 1, fontSize: 16, lineHeight: 21, maxHeight: 120, minHeight: 44, paddingHorizontal: 4, paddingVertical: 11 },
  send: { alignItems: 'center', backgroundColor: '#315C45', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  sendDisabled: { backgroundColor: '#B8BDB7' },
  pressed: { opacity: 0.7 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.35)', flex: 1, justifyContent: 'flex-end', padding: 18 },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 20, gap: 4, padding: 18 },
  menuTitle: { color: '#20241F', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  menuItem: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48 },
  menuText: { color: '#20241F', fontSize: 16 },
});
