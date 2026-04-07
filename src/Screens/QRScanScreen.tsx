import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import colors from '../themes/colors';

export default function QRScanScreen({ navigation }: { navigation: any }) {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (scanned || codes.length === 0) return;
      const value = codes[0].value;
      if (!value) return;

      setScanned(true);
      navigation.replace('PitsCustomerDetails', {
        MID:     value,
        MName:   '',
        tblCode: 'QR',
      });
    },
  });

  if (!hasPermission) {
    return (
      <View style={S.centered}>
        <Text style={S.permText}>Camera permission is required.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={S.centered}>
        <Text style={S.permText}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar */}
      <View style={S.topBar}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={S.topTitle}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanned}
        codeScanner={codeScanner}
      />

      {/* Corner markers overlay */}
      <View pointerEvents="none" style={S.finderOverlay}>
        <View style={S.finder}>
          <View style={[S.corner, S.cornerTL]} />
          <View style={[S.corner, S.cornerTR]} />
          <View style={[S.corner, S.cornerBL]} />
          <View style={[S.corner, S.cornerBR]} />
        </View>
      </View>

      {/* Bottom bar */}
      <View style={S.bottomWrap}>
        <Text style={S.hint}>Point the camera at a QR code</Text>
        {scanned && (
          <TouchableOpacity
            style={S.retryBtn}
            onPress={() => setScanned(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.white} />
            <Text style={S.retryText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const FINDER_SIZE = 220;
const CORNER_SIZE = 28;
const CORNER_W    = 3;

const S = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  permText: { color: '#fff', fontSize: 15 },

  topBar: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    zIndex:            10,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        Platform.OS === 'ios' ? 56 : 36,
    paddingBottom:     16,
    backgroundColor:   'rgba(0,0,0,0.5)',
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  topTitle: {
    fontSize:      17,
    fontWeight:    '700',
    color:         colors.white,
    letterSpacing: 0.3,
  },

  bottomWrap: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    zIndex:          10,
    alignItems:      'center',
    gap:             16,
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  hint:     { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   colors.primary,
    paddingHorizontal: 24,
    paddingVertical:   12,
    borderRadius:      20,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.white },

  finderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         5,
  },
  finder: {
    width:           FINDER_SIZE,
    height:          FINDER_SIZE,
    backgroundColor: 'transparent',
  },
  corner:   { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.white },
  cornerTL: { top: 0,    left: 0,    borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W },
  cornerTR: { top: 0,    right: 0,   borderTopWidth: CORNER_W, borderRightWidth: CORNER_W },
  cornerBL: { bottom: 0, left: 0,    borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W },
  cornerBR: { bottom: 0, right: 0,   borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W },
});