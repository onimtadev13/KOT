import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const PAYMENT_TYPES  = ['Free', 'Paid'];
const DELIVERY_TYPES = ['In House', 'Gate Pass'];

const PURPLE_DEEP = '#3D013C';
const PURPLE      = '#6C1FC9';
const PURPLE_SOFT = '#F3EEFF';
const WHITE       = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#292b2f';
const TEXT_LIGHT  = '#B0B8C1';

interface Props {
  visible:          boolean;
  total:            number;
  memberName:       string;
  memberId:         string | null;
  guestId?:         string;
  tableCode?:       string;
  pitName?:         string;
  managers:         { label: string; value: string }[];
  managersLoading:  boolean;
  kotReqBy:         string;
  kotPaymentType:   string;   // 'Free' | 'Paid' | ''
  kotDeliveryType:  string;   // 'In House' | 'Gate Pass' | ''
  kotSending:       boolean;  // true while API call is in flight
  onClose:          () => void;
  onReqByChange:    (val: string) => void;
  onPaymentType:    (val: string) => void;
  onDeliveryType:   (val: string) => void;
  onSend:           () => void;
}

function formatPrice(n: number): string {
  return `LKR ${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function KotModal({
  visible,
  total,
  memberName,
  memberId,
  guestId,
  tableCode,
  pitName,
  managers,
  managersLoading,
  kotReqBy,
  kotPaymentType,
  kotDeliveryType,
  kotSending,
  onClose,
  onReqByChange,
  onPaymentType,
  onDeliveryType,
  onSend,
}: Props) {
  const memberInitial = memberName ? memberName.charAt(0).toUpperCase() : '?';
  const sendDisabled  = !kotReqBy || kotSending;

  function SelectTile({
    label,
    checked,
    onPress,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[K.checkTile, checked && K.checkTileOn]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[K.checkBox, checked && K.checkBoxOn]}>
          {checked && <Ionicons name="checkmark" size={15} color="#fff" />}
        </View>
        <Text style={[K.checkLabel, checked && K.checkLabelOn]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={K.overlay}>
        {/* Tap-outside-to-close backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={K.sheet}>
          {/* Purple header */}
          <View style={K.header}>
            <View>
              <Text style={K.headerTitle}>KOT</Text>
              <Text style={K.headerSub}>In House / Gate Pass</Text>
            </View>
            <TouchableOpacity style={K.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={K.scrollArea}
            contentContainerStyle={K.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Total */}
            <View style={K.totalBlock}>
              <Text style={K.totalLabel}>Total Amount</Text>
              <Text style={K.totalValue}>{formatPrice(total)}</Text>
            </View>

            <View style={K.divider} />

            {/* Member card */}
            <View>
              <Text style={K.sectionLabel}>Member Details</Text>
              <View style={K.memberCard}>
                <View style={K.memberTop}>
                  <View style={K.memberAvatar}>
                    <Text style={K.memberAvatarText}>{memberInitial}</Text>
                  </View>
                  <View style={K.memberInfo}>
                    <View style={K.memberNameRow}>
                      <Text style={K.memberName} numberOfLines={1} adjustsFontSizeToFit>
                        {memberName}
                      </Text>
                      <View style={K.statusBadge}>
                        <View style={K.statusDot} />
                        <Text style={K.statusText}>Active</Text>
                      </View>
                    </View>
                    {!!memberId && (
                      <View style={K.memberIdChip}>
                        <Ionicons name="card-outline" size={13} color={PURPLE} />
                        <Text style={K.memberIdText}>{memberId}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={K.memberMetaRow}>
                  {!!guestId && (
                    <View style={K.memberMeta}>
                      <Ionicons name="card-outline" size={14} color="#7C3AED" />
                      <Text style={K.memberMetaText}>{guestId}</Text>
                    </View>
                  )}
                  {!!tableCode && (
                    <View style={K.memberMeta}>
                      <Ionicons name="easel-outline" size={14} color="#7C3AED" />
                      <Text style={K.memberMetaText}>Table {tableCode}</Text>
                    </View>
                  )}
                  {!!pitName && (
                    <View style={K.memberMeta}>
                      <Ionicons name="location-outline" size={14} color="#7C3AED" />
                      <Text style={K.memberMetaText}>Pit {pitName}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={K.divider} />

            {/* Req By */}
            <View>
              <View style={K.fieldLabelRow}>
                <Text style={K.fieldLabel}>Req By</Text>
                <View style={K.reqBadge}>
                  <Text style={K.reqBadgeText}>Required</Text>
                </View>
              </View>

              {managersLoading ? (
                <View style={[K.pickerWrap, { justifyContent: 'center', alignItems: 'center', height: 54 }]}>
                  <Text style={{ color: TEXT_LIGHT, fontSize: 13, fontWeight: '600' }}>
                    Loading managers…
                  </Text>
                </View>
              ) : (
                <View style={[K.pickerWrap, !kotReqBy && K.pickerWrapEmpty]}>
                  <Picker
                    selectedValue={kotReqBy}
                    onValueChange={onReqByChange}
                    style={K.picker}
                    dropdownIconColor="#6B7280"
                  >
                    {managers.map(m => (
                      <Picker.Item
                        key={m.value}
                        label={m.label}
                        value={m.value}
                        color={m.value === '' ? TEXT_LIGHT : TEXT_DARK}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={K.divider} />

            {/* Payment type — single select: Free / Paid */}
            <View>
              <Text style={K.sectionLabel}>Payment Type</Text>
              <View style={K.checkGrid}>
                {PAYMENT_TYPES.map(type => (
                  <SelectTile
                    key={type}
                    label={type}
                    checked={kotPaymentType === type}
                    onPress={() => onPaymentType(type)}
                  />
                ))}
              </View>
            </View>

            <View style={K.divider} />

            {/* Delivery type — single select: In House / Gate Pass */}
            <View>
              <Text style={K.sectionLabel}>Delivery Type</Text>
              <View style={K.checkGrid}>
                {DELIVERY_TYPES.map(type => (
                  <SelectTile
                    key={type}
                    label={type}
                    checked={kotDeliveryType === type}
                    onPress={() => onDeliveryType(type)}
                  />
                ))}
              </View>
            </View>

            {/* Send / Cancel */}
            <View style={K.actionRow}>
              <TouchableOpacity
                style={[K.btnSend, sendDisabled && K.btnSendDisabled]}
                onPress={onSend}
                disabled={sendDisabled}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={K.btnSendText}>
                  {kotSending ? 'Sending…' : 'Send'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={K.btnCancel}
                onPress={onClose}
                disabled={kotSending}
                activeOpacity={0.85}
              >
                <Text style={K.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const K = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 30,
  },
  header: {
    backgroundColor: PURPLE_DEEP,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 30, fontWeight: '900', color: WHITE, letterSpacing: 2 },
  headerSub:   { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  scrollArea:    { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 48 : 28,
    gap: 16,
  },
  totalBlock: {
    backgroundColor: PURPLE_SOFT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D3FF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: TEXT_MID },
  totalValue: { fontSize: 28, fontWeight: '900', color: PURPLE_DEEP },
  divider:    { height: 1, backgroundColor: BORDER },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: TEXT_LIGHT,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
  },
  memberCard: {
    backgroundColor: PURPLE_SOFT, borderRadius: 16,
    borderWidth: 1, borderColor: '#E9D8FD', padding: 16,
  },
  memberTop: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E9D8FD', marginBottom: 14,
  },
  memberAvatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  memberAvatarText: { fontSize: 24, fontWeight: '900', color: WHITE },
  memberInfo:   { flex: 1, gap: 6 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 20, fontWeight: '900', color: PURPLE_DEEP, flex: 1, letterSpacing: -0.3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  memberIdChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: WHITE, borderWidth: 1, borderColor: '#C4B5FD',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  memberIdText:  { fontSize: 14, fontWeight: '800', color: PURPLE },
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  memberMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberMetaText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabel:    { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  reqBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  reqBadgeText:  { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  pickerWrap: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12,
    overflow: 'hidden', backgroundColor: WHITE,
  },
  pickerWrapEmpty: { borderColor: '#F87171' },
  picker:   { height: 54, color: TEXT_DARK },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkTile: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 16, backgroundColor: WHITE,
  },
  checkTileOn: { borderColor: PURPLE, backgroundColor: PURPLE_SOFT },
  checkBox: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    borderColor: '#D1D5DB', backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkBoxOn:    { backgroundColor: PURPLE, borderColor: PURPLE },
  checkLabel:    { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  checkLabelOn:  { color: PURPLE_DEEP },
  actionRow:     { flexDirection: 'row', gap: 12 },
  btnSend: {
    flex: 1, height: 58, backgroundColor: PURPLE_DEEP, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: PURPLE_DEEP, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  btnSendDisabled: { backgroundColor: '#C4CCDA', shadowOpacity: 0, elevation: 0 },
  btnSendText:  { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 0.5 },
  btnCancel: {
    flex: 1, height: 58, backgroundColor: WHITE, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 18, fontWeight: '700', color: TEXT_MID },
});