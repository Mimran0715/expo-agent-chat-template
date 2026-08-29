import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/chat/icon-button';

type AccountModalProps = {
  mode: 'profile' | 'settings';
  onClose: () => void;
  visible: boolean;
};

export function AccountModal({ mode, onClose, visible }: AccountModalProps) {
  const isProfile = mode === 'profile';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [agentUpdatesEnabled, setAgentUpdatesEnabled] = useState(true);
  const sheetProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      sheetProgress.setValue(1);
      return;
    }

    sheetProgress.setValue(1);
    Animated.timing(sheetProgress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [sheetProgress, visible]);

  return (
    <Modal animationType="none" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel={`Close ${mode}`} onPress={onClose} style={styles.backdropDismiss} />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 700] }) }] },
          ]}>
          <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{isProfile ? 'Your profile' : 'Settings'}</Text>
            <IconButton name="close" accessibilityLabel={`Close ${mode}`} onPress={onClose} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {isProfile ? (
              <ProfileContent onDone={onClose} />
            ) : (
              <View style={styles.sections}>
                <Text style={styles.sectionLabel}>PREFERENCES</Text>
                <View style={styles.card}>
                  <SettingRow
                    icon="notifications-outline"
                    label="Notifications"
                    onValueChange={setNotificationsEnabled}
                    value={notificationsEnabled}
                  />
                  <View style={styles.divider} />
                  <SettingRow
                    icon="sparkles-outline"
                    label="Agent activity updates"
                    onValueChange={setAgentUpdatesEnabled}
                    value={agentUpdatesEnabled}
                  />
                </View>

                <Text style={styles.sectionLabel}>GENERAL</Text>
                <View style={styles.card}>
                  <MenuRow icon="shield-checkmark-outline" label="Privacy & data" />
                  <View style={styles.divider} />
                  <MenuRow icon="help-circle-outline" label="Help & support" />
                  <View style={styles.divider} />
                  <MenuRow icon="information-circle-outline" label="About" value="1.0.0" />
                </View>
              </View>
            )}
          </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ProfileContent({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('Jordan Davis');
  const [email, setEmail] = useState('jordan@example.com');

  return (
    <View style={styles.profileContent}>
      <View style={styles.largeAvatar}><Text style={styles.largeInitials}>JD</Text></View>
      <Text style={styles.avatarAction}>Change photo</Text>
      <View style={styles.form}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput autoCapitalize="words" onChangeText={setName} style={styles.input} value={name} />
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} />
      </View>
      <Pressable onPress={onDone} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <Text style={styles.primaryButtonText}>Save changes</Text>
      </Pressable>
    </View>
  );
}

type SettingRowProps = { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onValueChange: (value: boolean) => void; value: boolean };

function SettingRow({ icon, label, onValueChange, value }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={21} color="#536057" />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch onValueChange={onValueChange} trackColor={{ false: '#D5D9D3', true: '#7EA68C' }} thumbColor="#FFFFFF" value={value} />
    </View>
  );
}

function MenuRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value?: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Ionicons name={icon} size={21} color="#536057" />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : <Ionicons name="chevron-forward" size={18} color="#929991" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(22, 28, 24, 0.24)', flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  sheet: { backgroundColor: '#F7F8F5', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: '68%', overflow: 'hidden' },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { alignItems: 'center', borderBottomColor: '#E3E6E0', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 60, justifyContent: 'space-between', paddingLeft: 20, paddingRight: 10 },
  title: { color: '#20241F', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  content: { padding: 20 },
  profileContent: { alignItems: 'center', paddingTop: 12 },
  largeAvatar: { alignItems: 'center', backgroundColor: '#D9E4DA', borderRadius: 46, height: 92, justifyContent: 'center', width: 92 },
  largeInitials: { color: '#315C45', fontSize: 27, fontWeight: '800' },
  avatarAction: { color: '#315C45', fontSize: 14, fontWeight: '700', marginTop: 10 },
  form: { alignSelf: 'stretch', gap: 8, marginTop: 30 },
  inputLabel: { color: '#596159', fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#DDE1DA', borderRadius: 12, borderWidth: 1, color: '#20241F', fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#315C45', borderRadius: 13, marginTop: 24, paddingVertical: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  sections: { gap: 10 },
  sectionLabel: { color: '#858D85', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginLeft: 6, marginTop: 12 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DE', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 15 },
  rowPressed: { backgroundColor: '#F0F2EE' },
  rowLabel: { color: '#303630', flex: 1, fontSize: 15, fontWeight: '500' },
  rowValue: { color: '#929991', fontSize: 14 },
  divider: { backgroundColor: '#E8EAE5', height: StyleSheet.hairlineWidth, marginLeft: 48 },
});
