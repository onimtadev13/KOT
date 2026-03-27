// src/Hooks/useAppBack.ts
import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';

export function useAppBack(fallback?: string) {
  const navigation = useNavigation();   // ← gets the ROOT navigation, not drawer-scoped

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else if (fallback) {
          navigation.navigate(fallback as never);
        }
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [navigation, fallback]),
  );
}