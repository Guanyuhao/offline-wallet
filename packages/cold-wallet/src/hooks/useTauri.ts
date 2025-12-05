import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TauriApi {
  invoke: typeof invoke;
}

let tauriApi: TauriApi | null = null;

export function useTauri() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTauri() {
      try {
        tauriApi = {
          invoke,
        };
        setIsReady(true);
      } catch (error) {
        console.warn('Tauri API 不可用:', error);
        setIsReady(false);
      }
    }
    loadTauri();
  }, []);

  return {
    tauri: tauriApi,
    isReady,
  };
}
