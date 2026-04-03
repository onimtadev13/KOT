import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import colors from '../themes/colors';

interface Props {
  visible:      boolean;
  itemName:     string;
  qty:          string;
  orderSending: boolean;
  onQtyChange:  (val: string) => void;
  onAdd:        () => void;
  onOrder:      () => void;
  onReturn:     () => void;
  onCancel:     () => void;
}

export default function AddToOrderModal({
  visible,
  itemName,
  qty,
  orderSending,
  onQtyChange,
  onAdd,
  onOrder,
  onReturn,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={S.overlay}>
        <View style={S.card}>

          {/* ── Title ── */}
          <Text style={S.title}>Add to Order</Text>
          <Text style={S.sub}>Add Qty to Order</Text>
          <Text style={S.itemName} numberOfLines={2}>{itemName}</Text>

          {/* ── Qty input ── */}
          <TextInput
            style={S.qtyInput}
            value={qty}
            onChangeText={onQtyChange}
            keyboardType="numeric"
            placeholder="Enter quantity"
            placeholderTextColor={colors.text.light}
          />

          {/* ── Buttons — 2 × 2 grid ── */}
          <View style={S.btnGrid}>
            {/* Row 1 */}
            <TouchableOpacity
              style={[S.btn, { backgroundColor: colors.buttons.add }]}
              onPress={onAdd}
              activeOpacity={0.85}
            >
              <Text style={S.btnText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.btn, { backgroundColor: colors.buttons.order }, orderSending && S.btnDisabled]}
              onPress={onOrder}
              disabled={orderSending}
              activeOpacity={0.85}
            >
              {orderSending
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={S.btnText}>Order</Text>
              }
            </TouchableOpacity>

            {/* Row 2 */}
            <TouchableOpacity
              style={[S.btn, { backgroundColor: colors.buttons.return }]}
              onPress={onReturn}
              activeOpacity={0.85}
            >
              <Text style={S.btnText}>Return</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.btn, { backgroundColor: colors.buttons.cancel }]}
              onPress={onCancel}
              activeOpacity={0.85}
            >
              <Text style={S.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay.black40,
    justifyContent:  'center',
    alignItems:      'center',
  },
  card: {
    width:           '85%',
    backgroundColor: colors.white,
    borderRadius:    18,
    padding:         20,
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowRadius:    10,
    elevation:       10,
  },
  title: {
    fontSize:    18,
    fontWeight:  '800',
    color:       colors.text.dark,
    textAlign:   'center',
    marginBottom: 6,
  },
  sub: {
    fontSize:    12,
    color:       colors.text.mid,
    textAlign:   'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize:    13,
    fontWeight:  '600',
    color:       colors.text.dark,
    textAlign:   'center',
    marginBottom: 14,
  },
  qtyInput: {
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize:        16,
    textAlign:       'center',
    marginBottom:    18,
    color:           colors.text.dark,
  },

  // ── 2 × 2 grid — each button takes exactly 48% width, fixed height ────────
  btnGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            10,
  },
  btn: {
    width:          '47%',   // fixed percentage — never stretches
    height:         44,      // fixed height — never grows
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color:      colors.white,
    fontWeight: '700',
    fontSize:   13,
  },
});