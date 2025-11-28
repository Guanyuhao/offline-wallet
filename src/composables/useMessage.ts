import { useMessage } from 'naive-ui';

type MessageApi = ReturnType<typeof useMessage>;

let messageApi: MessageApi | null = null;

export function setMessageApi(api: MessageApi) {
  messageApi = api;
}

export function useAppMessage(): MessageApi {
  if (!messageApi) {
    // 返回一个安全的 fallback，避免抛出错误
    const fallback = {
      success: () => ({ destroy: () => {}, type: 'success' as const }),
      error: () => ({ destroy: () => {}, type: 'error' as const }),
      warning: () => ({ destroy: () => {}, type: 'warning' as const }),
      info: () => ({ destroy: () => {}, type: 'info' as const }),
      loading: () => ({ destroy: () => {}, type: 'loading' as const }),
      create: () => ({ destroy: () => {}, type: 'info' as const }),
      destroyAll: () => {},
    } as unknown as MessageApi;
    return fallback;
  }
  return messageApi;
}

