import { Button } from 'antd-mobile';
import { CloseCircleOutline } from 'antd-mobile-icons';

export interface ErrorBlockTexts {
  network?: string;
  rpc?: string;
  parse?: string;
  rateLimit?: string;
  retry?: string;
}

export interface ErrorBlockProps {
  /** 错误信息 */
  error: string | null;
  /** 重试回调 */
  onRetry?: () => void;
  /** 是否显示重试按钮，默认 true */
  showRetry?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 国际化文本（可选） */
  texts?: ErrorBlockTexts;
}

// 默认文本
const DEFAULT_TEXTS: ErrorBlockTexts = {
  network: '网络连接失败，请检查网络后重试',
  rpc: '节点请求失败，请稍后重试',
  parse: '数据解析失败',
  rateLimit: '请求过于频繁，请稍后重试',
  retry: '重试',
};

/**
 * 统一的错误提示组件
 */
export function ErrorBlock({ error, onRetry, showRetry = true, style, texts }: ErrorBlockProps) {
  if (!error) return null;

  const t = { ...DEFAULT_TEXTS, ...texts };

  // 解析错误信息，提供友好提示
  const getFriendlyMessage = (err: string): string => {
    const lowerErr = err.toLowerCase();

    // 网络错误
    if (
      lowerErr.includes('network') ||
      lowerErr.includes('failed to fetch') ||
      lowerErr.includes('timeout')
    ) {
      return t.network!;
    }

    // RPC 错误
    if (lowerErr.includes('rpc error')) {
      return t.rpc!;
    }

    // 解析错误
    if (lowerErr.includes('parse') || lowerErr.includes('invalid')) {
      return t.parse!;
    }

    // API 限流
    if (lowerErr.includes('rate limit') || lowerErr.includes('too many requests')) {
      return t.rateLimit!;
    }

    // 默认返回原始错误
    return err;
  };

  const friendlyMessage = getFriendlyMessage(error);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: 'var(--adm-color-danger)',
        ...style,
      }}
    >
      <CloseCircleOutline style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }} />
      <div
        style={{
          fontSize: 14,
          textAlign: 'center',
          marginBottom: showRetry && onRetry ? 16 : 0,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {friendlyMessage}
      </div>
      {showRetry && onRetry && (
        <Button
          size="small"
          color="primary"
          fill="outline"
          onClick={onRetry}
          style={{ borderRadius: 8 }}
        >
          {t.retry}
        </Button>
      )}
    </div>
  );
}

export default ErrorBlock;
