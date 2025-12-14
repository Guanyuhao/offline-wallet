import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface TokenBalance {
  symbol: string;
  contract: string;
  balance: string;
  decimals: number;
}

/**
 * 代币余额查询 Hook (带请求去重)
 */
export function useTokens(chain: string, address: string) {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastKeyRef = useRef('');

  const fetchTokens = useCallback(async () => {
    if (!chain || !address) return;

    // 只有 ETH、BNB、TRON 支持代币
    if (!['eth', 'bnb', 'tron'].includes(chain)) {
      setTokens([]);
      return;
    }

    // 请求去重
    const key = `${chain}:${address}`;
    if (fetchingRef.current && lastKeyRef.current === key) return;

    fetchingRef.current = true;
    lastKeyRef.current = key;

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('get_token_balances', { chain, address });
      const parsed = JSON.parse(result) as TokenBalance[];
      setTokens(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTokens([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [chain, address]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, loading, error, refetch: fetchTokens };
}
