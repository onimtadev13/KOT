import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const PURPLE_DEEP = '#3D013C';
const PURPLE      = '#6C1FC9';
const PURPLE_SOFT = '#F3EEFF';
const WHITE       = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#292b2f';
const TEXT_LIGHT  = '#B0B8C1';

interface Props {
  visible:        boolean;
  total:          number;
  butlerEnabled:  boolean;
  onClose:        () => void;
  onOrder:        () => void;
  onPaid:         () => void;
  onButlerChange: (val: boolean) => void;
}

function formatPrice(n: number): string {
  return `LKR ${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderModal({
  visible,
  total,
  butlerEnabled,
  onClose,
  onOrder,
  onPaid,
  onButlerChange,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={S.modalOverlay}>
        <View style={S.modalCard}>

          {/* Header */}
          <View style={S.modalHeader}>
            <View style={S.modalHeaderIconWrap}>
              <Ionicons name="receipt-outline" size={20} color={PURPLE} />
            </View>
            <Text style={S.modalTitle}>Order</Text>
            <TouchableOpacity
              style={S.modalCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={TEXT_MID} />
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View style={S.modalTotalRow}>
            <Text style={S.modalTotalLabel}>Total Amount</Text>
            <Text style={S.modalTotalValue}>{formatPrice(total)}</Text>
          </View>

          <View style={S.modalDivider} />

          {/* Order / Paid buttons */}
          <View style={S.modalBtnRow}>
            <TouchableOpacity
              style={[S.modalBtn, S.btnOrder]}
              onPress={onOrder}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={WHITE} />
              <Text style={S.modalBtnText}>Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.modalBtn, S.btnPaid]}
              onPress={onPaid}
              activeOpacity={0.85}
            >
              <Ionicons name="cash-outline" size={22} color={WHITE} />
              <Text style={S.modalBtnText}>Paid</Text>
            </TouchableOpacity>
          </View>

          <View style={S.modalDivider} />

          {/* Butler toggle */}
          <View style={S.butlerRow}>
            <View style={S.butlerLeft}>
              <View style={S.butlerIconWrap}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={butlerEnabled ? PURPLE : TEXT_LIGHT}
                />
              </View>
              <View>
                <Text style={S.butlerLabel}>BUTLER</Text>
                <Text style={S.butlerSub}>
                  {butlerEnabled ? 'Butler service enabled' : 'Butler service disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={butlerEnabled}
              onValueChange={onButlerChange}
              trackColor={{ false: '#E5E7EB', true: PURPLE_SOFT }}
              thumbColor={butlerEnabled ? PURPLE : '#D1D5DB'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalHeaderIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: TEXT_DARK, flex: 1 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTotalLabel: { fontSize: 14, fontWeight: '600', color: TEXT_MID },
  modalTotalValue: { fontSize: 20, fontWeight: '900', color: PURPLE_DEEP },
  modalDivider:  { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalBtn: {
    flex: 1, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnOrder: { backgroundColor: PURPLE_DEEP, shadowColor: PURPLE_DEEP },
  btnPaid:  { backgroundColor: '#16A34A',   shadowColor: '#16A34A'   },
  modalBtnText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.5 },
  butlerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  butlerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  butlerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  butlerLabel: { fontSize: 14, fontWeight: '800', color: TEXT_DARK, letterSpacing: 1.5 },
  butlerSub:   { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500', marginTop: 2 },
});