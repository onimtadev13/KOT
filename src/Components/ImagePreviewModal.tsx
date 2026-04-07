import React from 'react';
import {
  View,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import colors from '../themes/colors';

const C = colors.pitCustomer;

type Props = {
  visible: boolean;
  base64:  string;
  name?:   string;
  onClose: () => void;
};

export default function ImagePreviewModal({ visible, base64, name, onClose }: Props) {
  if (!base64.trim()) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={S.overlay}>

          <TouchableWithoutFeedback>
            <View style={S.sheet}>

              {/* ── Handle bar ── */}
              <View style={S.handle} />

              {/* ── Header ── */}
              <View style={S.header}>
                <View style={S.headerLeft}>
                  <View style={S.headerIconWrap}>
                    <Ionicons name="person-outline" size={14} color={C.purpleDeep} />
                  </View>
                  <Text style={S.headerTitle} numberOfLines={1}>
                    {name ? name : 'Member Photo'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={S.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={16} color={C.textMid} />
                </TouchableOpacity>
              </View>

              {/* ── Image ── */}
              <View style={S.imageWrap}>
                <Image
                  source={{ uri: `data:image/png;base64,${base64}` }}
                  style={S.image}
                  resizeMode="cover"
                />
                {/* Purple tint ring */}
                <View style={S.imageRing} />
              </View>

              {/* ── Footer hint ── */}
              {/* <View style={S.footer}>
                <Ionicons name="hand-left-outline" size={13} color={C.textLight} />
                <Text style={S.footerText}>Tap outside to dismiss</Text>
              </View> */}

            </View>
          </TouchableWithoutFeedback>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 32,
  },

  sheet: {
    backgroundColor: C.card,
    borderRadius:    28,
    width:           '100%',
    alignItems:      'center',
    paddingBottom:   28,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     C.purpleDeep,
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.25,
    shadowRadius:    24,
    elevation:       16,
  },

  // ── Handle ──
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.border,
    marginTop:       12,
    marginBottom:    4,
  },

  // ── Header ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    width:             '100%',
    paddingHorizontal: 18,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom:      24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flex:          1,
  },
  headerIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: C.memberIdBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: {
    fontSize:      13,
    fontWeight:    '800',
    color:         C.textDark,
    letterSpacing: 0.2,
    flex:          1,
  },
  closeBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: C.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      8,
  },

  // ── Image ──
  imageWrap: {
    width:        220,
    height:       220,
    borderRadius: 110,
    position:     'relative',
    marginBottom: 24,
    shadowColor:  C.purpleDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius:  12,
    elevation:     8,
  },
  image: {
    width:        220,
    height:       220,
    borderRadius: 110,
    borderWidth:  3,
    borderColor:  colors.white,
  },
  imageRing: {
    position:     'absolute',
    top:          -5,
    left:         -5,
    width:        230,
    height:       230,
    borderRadius: 115,
    borderWidth:  2.5,
    borderColor:  C.purpleDeep,
    opacity:      0.25,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  footerText: {
    fontSize:   11,
    color:      C.textLight,
    fontWeight: '500',
  },
});