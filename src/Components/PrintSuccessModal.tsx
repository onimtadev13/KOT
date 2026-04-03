import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import colors from '../themes/colors'; // adjust path as needed

interface Props {
  visible: boolean;
  onDone:  () => void;
}

export default function PrintSuccessModal({ visible, onDone }: Props) {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => lottieRef.current?.play(), 100);

      const timer = setTimeout(() => {
        onDone();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDone}
    >
      <View style={S.overlay}>
        <View style={S.card}>
          <View style={S.animWrap}>
            <LottieView
              ref={lottieRef}
              source={require('../../assets/animations/Done.json')}
              autoPlay={false}
              loop={false}
              style={S.lottie}
            />
          </View>

          <Text style={S.title}>Print Done</Text>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex:              1,
    backgroundColor:   colors.printSuccessModal.overlay,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor:   colors.printSuccessModal.card,
    borderRadius:      28,
    paddingTop:        32,
    paddingBottom:     28,
    paddingHorizontal: 28,
    alignItems:        'center',
    width:             '100%',
    shadowColor:       colors.printSuccessModal.shadow,
    shadowOffset:      { width: 0, height: 8 },
    shadowOpacity:     0.18,
    shadowRadius:      24,
    elevation:         20,
  },
  animWrap: {
    width:           180,
    height:          180,
    marginBottom:    8,
    alignItems:      'center',
    justifyContent:  'center',
  },
  lottie: {
    width:  180,
    height: 180,
  },
  title: {
    fontSize:      26,
    fontWeight:    '900',
    color:         colors.printSuccessModal.textDark,
    letterSpacing: -0.3,
    marginBottom:  8,
  },
});