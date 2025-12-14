import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ChainType } from '@offline-wallet/shared/config';

/**
 * 交易信息
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber?: number;
  status?: 'pending' | 'success' | 'failed';
  fee?: string;
}

/**
 * 交易历史查询 Hook (带请求去重)
 */
export function useTransactions(chain: ChainType, address: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastKeyRef = useRef('');

  const fetchTransactions = useCallback(async () => {
    if (!address) return;

    // 请求去重
    const key = `${chain}:${address}`;
    if (fetchingRef.current && lastKeyRef.current === key) return;

    fetchingRef.current = true;
    lastKeyRef.current = key;

    try {
      setLoading(true);
      setError(null);
      const result = await invoke<string>('get_transaction_history', { chain, address });

      // 解析 JSON
      const txs = JSON.parse(result) as Transaction[];
      setTransactions(txs);
    } catch (err) {
      console.error('查询交易历史失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [chain, address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

/**
 * 交易广播 Hook
 */
export function useBroadcastTransaction() {
  const [broadcasting, setBroadcasting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const broadcast = useCallback(async (chain: ChainType, signedTx: string) => {
    try {
      setBroadcasting(true);
      setError(null);
      setTxHash(null);

      const hash = await invoke<string>('broadcast_transaction', { chain, signedTx });
      setTxHash(hash);
      return hash;
    } catch (err) {
      console.error('广播交易失败:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setBroadcasting(false);
    }
  }, []);

  return {
    broadcast,
    broadcasting,
    txHash,
    error,
  };
}
