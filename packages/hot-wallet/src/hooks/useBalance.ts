import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ChainType } from '@offline-wallet/shared/config';

/**
 * 余额查询 Hook (带请求去重)
 */
export function useBalance(chain: ChainType, address: string) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastKeyRef = useRef('');

  const fetchBalance = useCallback(async () => {
    if (!address) return;

    // 请求去重
    const key = `${chain}:${address}`;
    if (fetchingRef.current && lastKeyRef.current === key) return;

    fetchingRef.current = true;
    lastKeyRef.current = key;

    try {
      setLoading(true);
      setError(null);
      const result = await invoke<string>('get_balance', { chain, address });
      setBalance(result);
    } catch (err) {
      console.error('查询余额失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [chain, address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Gas 费估算 Hook
 */
export function useEstimateGas(chain: ChainType, txData: string | null) {
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!txData) return;

    const estimate = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await invoke<string>('estimate_gas', { chain, txData });
        setGasEstimate(result);
      } catch (err) {
        console.error('估算 Gas 失败:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    estimate();
  }, [chain, txData]);

  return {
    gasEstimate,
    loading,
    error,
  };
}
