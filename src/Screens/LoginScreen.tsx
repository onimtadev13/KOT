import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Easing,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import DeviceInfo from 'react-native-device-info';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { login as apiLogin } from '../Api/api';
import { useAppStore } from '../Store/store';
import { RootStackParamList } from '../Routes/Navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ─────────────────────────────────────────────────────────────────────────────
// KotLogo
// ─────────────────────────────────────────────────────────────────────────────
function KotLogo() {
  return (
    <View style={logoS.circle}>
      <View style={logoS.dome} />
      <View style={logoS.plate} />
      <View style={logoS.stem} />
      <View style={logoS.knob} />
    </View>
  );
}

const logoS = StyleSheet.create({
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dome: {
    position: 'absolute',
    bottom: 16,
    width: 36,
    height: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#6C1FC9',
    opacity: 0.9,
  },
  plate: {
    position: 'absolute',
    bottom: 12,
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(108,31,201,0.4)',
  },
  stem: {
    position: 'absolute',
    bottom: 34,
    width: 3,
    height: 7,
    borderRadius: 2,
    backgroundColor: '#6C1FC9',
    opacity: 0.85,
  },
  knob: {
    position: 'absolute',
    bottom: 40,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6C1FC9',
    opacity: 0.85,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const setLoginData = useAppStore(state => state.setLoginData);
  const device       = useAppStore(state => state.device);

  const unitLabel = device?.Device_Id ? `Unit ${device.Device_Id}` : 'Unit';

  /* state */
  const [password,     setPassword]     = useState('');
  const [changeKeypad, setChangeKeypad] = useState(false);
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [focused,      setFocused]      = useState(false);

  /* animated values */
  const inputRef = useRef<TextInput>(null);
  const shakeX   = useRef(new Animated.Value(0)).current;
  const headerA  = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-24)).current;
  const logoA    = useRef(new Animated.Value(0)).current;
  const logoSc   = useRef(new Animated.Value(0.88)).current;
  const cardA    = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(28)).current;
  const btnA     = useRef(new Animated.Value(0)).current;
  const btnSc    = useRef(new Animated.Value(0.9)).current;

  /* entrance animation */
  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 350, easing: ease, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(logoA,  { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(logoSc, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardA, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 300, easing: ease, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnA,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(btnSc, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* shake on bad input */
  function shake() {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 9,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0,  duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function toggleKeypad() {
    setChangeKeypad(p => !p);
    setPassword('');
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function handleLogin() {
    if (!password.trim()) {
      shake();
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const mac    = await DeviceInfo.getUniqueId();
      const result = await apiLogin(password, mac);

      switch (result.status) {
        case 'success': {
          const deviceId = result.data?.Device_Id ?? 0;
          await setLoginData(
            {
              Emp_Name:    result.data?.Emp_Name    ?? '',
              Sec_Lvl:     result.data?.Sec_Lvl     ?? 0,
              TabLocation: result.data?.TabLocation ?? '',
              StewardName: result.data?.StewardName ?? '',
            },
            {
              Device_Id: deviceId,
              Doc_No:    result.data?.Doc_No ?? '',
              UniqueId:  mac,
            },
          );
          navigation.replace('Main');
          break;
        }
        case 'wrong_password':
          Alert.alert('Incorrect Passcode', result.message);
          shake();
          setPassword('');
          break;
        case 'device_not_found':
          Alert.alert('Device Not Registered', result.message);
          break;
        case 'error':
          Alert.alert('Connection Error', result.message);
          break;
      }
    } catch (error: any) {
      console.error('[LOGIN] Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={S.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#6C1FC9" />

      {/* ── Scrollable content — header + logo + card (NO button) ── */}
      <ScrollView
        contentContainerStyle={S.root}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Purple header ── */}
        <Animated.View
          style={[S.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}
        >
          <View style={S.headerLeft}>
            <View style={S.logoCircle}>
              <KotLogo />
            </View>
            <View>
              <Text style={S.headerTitle}>KOT</Text>
              <Text style={S.headerSub}>Kitchen Order Ticket</Text>
            </View>
          </View>
          <View style={S.headerRight}>
            <View style={S.versionChip}>
              <Text style={S.versionText}>{unitLabel}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Logo image ── */}
        <Animated.View
          style={[S.logoSection, { opacity: logoA, transform: [{ scale: logoSc }] }]}
        >
          <View style={S.logoImageWrap}>
            <Image
              source={require('../../assets/icons/kot_logo2.png')}
              style={S.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* ── Login card — button is NOT inside here ── */}
        <Animated.View
          style={[S.card, { opacity: cardA, transform: [{ translateY: cardY }] }]}
        >
          {/* Field label */}
          <View style={S.fieldLabelRow}>
            <Text style={S.fieldLabel}>
              {changeKeypad ? 'PASSWORD' : 'PASSCODE'}
            </Text>
          </View>

          {/* Input row */}
          <Animated.View
            style={[
              S.inputBox,
              focused && S.inputBoxFocused,
              { transform: [{ translateX: shakeX }] },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={17}
              color={focused ? '#6C1FC9' : '#B0B8C1'}
              style={S.inputLeadIcon}
            />
            <TextInput
              ref={inputRef}
              style={S.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              keyboardType={changeKeypad ? 'default' : 'numeric'}
              placeholder={changeKeypad ? 'Enter your password' : 'Enter passcode'}
              placeholderTextColor="#C8D0D8"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <TouchableOpacity
              style={S.eyeBtn}
              onPress={() => setShowPass(p => !p)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={focused ? '#6C1FC9' : '#B0B8C1'}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Change Keypad toggle */}
          <TouchableOpacity
            style={S.checkRow}
            onPress={toggleKeypad}
            activeOpacity={0.75}
          >
            <View style={[S.checkbox, changeKeypad && S.checkboxOn]}>
              {changeKeypad && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text style={S.checkLabel}>Change Keypad</Text>
            <View style={S.hintChip}>
              <Ionicons
                name={changeKeypad ? 'keypad-outline' : 'calculator-outline'}
                size={11}
                color="#B0B8C1"
                style={{ marginRight: 3 }}
              />
              <Text style={S.hintChipText}>
                {changeKeypad ? 'Full keyboard' : 'Number pad'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Divider — no bottom margin since button lives outside */}
          <View style={S.divider} />
        </Animated.View>
      </ScrollView>

      {/* ── Login button — pinned OUTSIDE ScrollView, always visible above keyboard ── */}
      <Animated.View
        style={[S.btnWrap, { opacity: btnA, transform: [{ scale: btnSc }] }]}
      >
        <TouchableOpacity
          style={[S.btn, loading && S.btnLoading]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={S.btnInner}>
              <Text style={S.btnText}>Login</Text>
              <View style={S.btnArrow}>
                <Ionicons name="arrow-forward" size={16} color="#6C1FC9" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE      = '#6C1FC9';
const PURPLE_DARK = '#4A0FA0';
const PURPLE_SOFT = '#F3EEFF';
const WHITE       = '#FFFFFF';
const BG          = '#F5F6FA';
const CARD_BG     = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#6B7280';
const TEXT_LIGHT  = '#B0B8C1';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },

  root: {
    flexGrow: 1,
    backgroundColor: BG,
    paddingBottom: 16,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 2,
    lineHeight: 28,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: { alignItems: 'flex-end' },
  versionChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  versionText: { color: WHITE, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // ── Logo section ──
  logoSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  logoImageWrap: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: WHITE,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  // ── Card ──
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,          // minimal bottom padding — button is outside
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_LIGHT,
    letterSpacing: 2,
  },

  // ── Input ──
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 14,
  },
  inputBoxFocused: {
    borderColor: PURPLE,
    backgroundColor: PURPLE_SOFT,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLeadIcon: { paddingLeft: 14, paddingRight: 6 },
  input: {
    flex: 1,
    color: TEXT_DARK,
    fontSize: 16,
    paddingVertical: 15,
    paddingRight: 4,
    letterSpacing: 0.3,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Keypad toggle ──
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn:  { backgroundColor: PURPLE, borderColor: PURPLE },
  checkLabel:  { flex: 1, fontSize: 14, fontWeight: '500', color: TEXT_MID },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hintChipText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 18,
    marginBottom: 18,   // no bottom gap — button is outside the card
  },

  // ── Login button — lives outside ScrollView ──
  btnWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 60,
    backgroundColor: BG,
  },
  btn: {
    height: 52,
    borderRadius: 13,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  btnLoading: { opacity: 0.65 },
  btnInner:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText:    { color: WHITE, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  btnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});