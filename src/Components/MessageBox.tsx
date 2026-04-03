import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import colors from '../themes/colors';

const C = colors.currentOrder;

export type MessageBoxVariant = 'danger' | 'warning' | 'success' | 'info';

export interface MessageBoxButton {
  label: string;
  style?: 'primary' | 'ghost' | 'destructive';
  onPress: () => void;
}

export interface MessageBoxProps {
  visible: boolean;
  variant?: MessageBoxVariant;
  title: string;
  message: string;
  buttons: MessageBoxButton[];
  onDismiss?: () => void;
}

const VARIANT_CONFIG: Record<MessageBoxVariant, { icon: string; accent: string; iconBg: string }> = {
  danger:  { icon: 'trash-outline',                accent: '#EF4444', iconBg: '#FEE2E2' },
  warning: { icon: 'warning-outline',              accent: '#F59E0B', iconBg: '#FEF3C7' },
  success: { icon: 'checkmark-circle-outline',     accent: '#10B981', iconBg: '#D1FAE5' },
  info:    { icon: 'information-circle-outline',   accent: C.purple,  iconBg: C.purpleSoft },
};

export default function MessageBox({
  visible,
  variant = 'info',
  title,
  message,
  buttons,
  onDismiss,
}: MessageBoxProps) {
  const cfg         = VARIANT_CONFIG[variant];
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,    damping: 18, stiffness: 280, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1,    duration: 180,               useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 0.88, damping: 20, stiffness: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,    duration: 140,               useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <Animated.View style={[S.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={S.overlayTouchable} activeOpacity={1} onPress={onDismiss} />
      </Animated.View>

      {/* Card + floating icon */}
      <View style={S.centeredWrap} pointerEvents="box-none">
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], width: '100%' }}>

          {/* Floating icon — sits above the card */}
          <View style={S.floatingIconWrap}>
            <View style={[S.floatingIcon, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={cfg.icon as any} size={36} color={cfg.accent} />
            </View>
          </View>

          {/* Card */}
          <View style={S.card}>
            {/* Body */}
            <View style={S.body}>
              <Text style={[S.title, { color: cfg.accent }]}>{title}</Text>
              <Text style={S.message}>{message}</Text>
            </View>

            {/* Divider */}
            <View style={S.divider} />

            {/* Buttons */}
            <View style={[S.btnRow, buttons.length > 2 && S.btnRowVertical]}>
              {buttons.map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isPrimary     = btn.style === 'primary';
                const isGhost       = btn.style === 'ghost' || !btn.style;

                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      S.btn,
                      buttons.length <= 2 && S.btnFlex,
                      isGhost       && S.btnGhost,
                      isPrimary     && { backgroundColor: C.purpleDeep },
                      isDestructive && { backgroundColor: cfg.accent },
                    ]}
                    onPress={btn.onPress}
                    activeOpacity={0.82}
                  >
                    <Text style={[S.btnText, isGhost && S.btnTextGhost]}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 20, 0.55)',
  },
  overlayTouchable: { flex: 1 },

  centeredWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 28,
  },

  // Floating icon above card
  floatingIconWrap: {
    alignItems:    'center',
    marginBottom:  -44,   // pulls the card up so it overlaps the icon
    zIndex:        10,
  },
  floatingIcon: {
    width:         88,
    height:        88,
    borderRadius:  26,
    alignItems:    'center',
    justifyContent:'center',
    borderWidth:   3,
    borderColor:   colors.white,
    // subtle elevation so it sits visibly above the card
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  12,
    elevation:     8,
  },

  // Card
  card: {
    backgroundColor: colors.card ?? '#FFFFFF',
    borderRadius:    28,
    paddingTop:      56,   // space for the overlapping icon
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 12 },
    shadowOpacity:   0.15,
    shadowRadius:    24,
    elevation:       18,
  },

  body: {
    paddingHorizontal: 24,
    paddingBottom:     20,
    alignItems:        'center',
    gap:               8,
  },
  title: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.3,
    textAlign:     'center',
  },
  message: {
    fontSize:   14,
    fontWeight: '500',
    color:      C.textMid,
    textAlign:  'center',
    lineHeight: 22,
  },

  divider: {
    height:          1,
    backgroundColor: C.border,
  },

  btnRow: {
    flexDirection:     'row',
    paddingHorizontal: 20,
    paddingVertical:   20,
    gap:               10,
  },
  btnRowVertical: { flexDirection: 'column' },

  btn: {
    height:         52,
    borderRadius:   999,         // full pill
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnFlex:  { flex: 1 },
  btnGhost: {
    backgroundColor: '#F3F4F6',
    borderWidth:     0,
  },
  btnText: {
    fontSize:      15,
    fontWeight:    '700',
    color:         colors.white,
    letterSpacing: 0.2,
  },
  btnTextGhost: {
    color: C.textMid,
  },
});