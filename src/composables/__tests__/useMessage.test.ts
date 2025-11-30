import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppMessage, setMessageApi } from '../useMessage';

// Mock naive-ui useMessage
const mockMessageApi = {
  success: vi.fn(() => ({ destroy: vi.fn(), type: 'success' as const })),
  error: vi.fn(() => ({ destroy: vi.fn(), type: 'error' as const })),
  warning: vi.fn(() => ({ destroy: vi.fn(), type: 'warning' as const })),
  info: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
  loading: vi.fn(() => ({ destroy: vi.fn(), type: 'loading' as const })),
  create: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
  destroyAll: vi.fn(),
};

vi.mock('naive-ui', () => ({
  useMessage: vi.fn(),
}));

describe('useMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 messageApi
    setMessageApi(null as any);
  });

  describe('setMessageApi', () => {
    it('应该设置 messageApi', () => {
      setMessageApi(mockMessageApi as any);
      const api = useAppMessage();

      expect(api).toBe(mockMessageApi);
    });
  });

  describe('useAppMessage', () => {
    it('在没有设置 messageApi 时应该返回 fallback', () => {
      const api = useAppMessage();

      expect(api).toBeDefined();
      expect(api.success).toBeDefined();
      expect(api.error).toBeDefined();
      expect(api.warning).toBeDefined();
      expect(api.info).toBeDefined();
      expect(api.loading).toBeDefined();
      expect(api.create).toBeDefined();
      expect(api.destroyAll).toBeDefined();
    });

    it('fallback 方法应该返回正确的对象', () => {
      const api = useAppMessage();

      const successResult = api.success('test');
      expect(successResult.type).toBe('success');
      expect(successResult.destroy).toBeDefined();
      expect(typeof successResult.destroy).toBe('function');

      const errorResult = api.error('test');
      expect(errorResult.type).toBe('error');

      const warningResult = api.warning('test');
      expect(warningResult.type).toBe('warning');

      const infoResult = api.info('test');
      expect(infoResult.type).toBe('info');

      const loadingResult = api.loading('test');
      expect(loadingResult.type).toBe('loading');
    });

    it('在设置 messageApi 后应该返回真实的 API', () => {
      setMessageApi(mockMessageApi as any);
      const api = useAppMessage();

      expect(api).toBe(mockMessageApi);
    });

    it('应该能够调用真实的 API 方法', () => {
      setMessageApi(mockMessageApi as any);
      const api = useAppMessage();

      api.success('test message');
      expect(mockMessageApi.success).toHaveBeenCalledWith('test message');

      api.error('error message');
      expect(mockMessageApi.error).toHaveBeenCalledWith('error message');

      api.warning('warning message');
      expect(mockMessageApi.warning).toHaveBeenCalledWith('warning message');

      api.info('info message');
      expect(mockMessageApi.info).toHaveBeenCalledWith('info message');

      api.loading('loading message');
      expect(mockMessageApi.loading).toHaveBeenCalledWith('loading message');

      api.destroyAll();
      expect(mockMessageApi.destroyAll).toHaveBeenCalled();
    });
  });

  describe('fallback 行为', () => {
    it('fallback destroy 方法应该可以安全调用', () => {
      const api = useAppMessage();

      const result = api.success('test');
      expect(() => {
        result.destroy();
      }).not.toThrow();
    });

    it('fallback destroyAll 方法应该可以安全调用', () => {
      const api = useAppMessage();

      expect(() => {
        api.destroyAll();
      }).not.toThrow();
    });

    it('fallback 方法不应该抛出错误', () => {
      const api = useAppMessage();

      expect(() => {
        api.success('test');
        api.error('test');
        api.warning('test');
        api.info('test');
        api.loading('test');
        api.create('test');
        api.destroyAll();
      }).not.toThrow();
    });
  });

  describe('API 替换', () => {
    it('应该能够替换 messageApi', () => {
      const firstApi = {
        success: vi.fn(() => ({ destroy: vi.fn(), type: 'success' as const })),
        error: vi.fn(() => ({ destroy: vi.fn(), type: 'error' as const })),
        warning: vi.fn(() => ({ destroy: vi.fn(), type: 'warning' as const })),
        info: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
        loading: vi.fn(() => ({ destroy: vi.fn(), type: 'loading' as const })),
        create: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
        destroyAll: vi.fn(),
      };

      const secondApi = {
        success: vi.fn(() => ({ destroy: vi.fn(), type: 'success' as const })),
        error: vi.fn(() => ({ destroy: vi.fn(), type: 'error' as const })),
        warning: vi.fn(() => ({ destroy: vi.fn(), type: 'warning' as const })),
        info: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
        loading: vi.fn(() => ({ destroy: vi.fn(), type: 'loading' as const })),
        create: vi.fn(() => ({ destroy: vi.fn(), type: 'info' as const })),
        destroyAll: vi.fn(),
      };

      setMessageApi(firstApi as any);
      expect(useAppMessage()).toBe(firstApi);

      setMessageApi(secondApi as any);
      expect(useAppMessage()).toBe(secondApi);
    });
  });
});
