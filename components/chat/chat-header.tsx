import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { IconButton } from './icon-button';

type Props = { title: string; onOpenSidebar: () => void };

export function ChatHeader({ title, onOpenSidebar }: Props) {
  return (
    <View style={styles.header}>
      <IconButton name="menu-outline" accessibilityLabel="Open conversations" onPress={onOpenSidebar} />
      <View style={styles.titleGroup}>
        <View style={styles.brandMark}><Ionicons name="sparkles" size={15} color="#FFFFFF" /></View>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', borderBottomColor: '#E7E9E3', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 60, justifyContent: 'space-between', paddingHorizontal: 10 },
  titleGroup: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 8, maxWidth: '68%' },
  brandMark: { alignItems: 'center', backgroundColor: '#315C45', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  title: { color: '#20241F', flexShrink: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSpacer: { width: 44 },
});
