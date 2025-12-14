/**
 * 热钱包错误提示组件（封装 shared 版本，注入 i18n）
 */

import {
  ErrorBlock as SharedErrorBlock,
  type ErrorBlockProps as SharedErrorBlockProps,
} from '@offline-wallet/shared/components';
import { useI18n } from '../hooks/useI18n';

interface ErrorBlockProps extends Omit<SharedErrorBlockProps, 'texts'> {}

export function ErrorBlock(props: ErrorBlockProps) {
  const t = useI18n();

  return (
    <SharedErrorBlock
      {...props}
      texts={{
        network: t.errors?.network,
        rpc: t.errors?.rpc,
        parse: t.errors?.parse,
        rateLimit: t.errors?.rateLimit,
        retry: t.errors?.retry,
      }}
    />
  );
}

export default ErrorBlock;
