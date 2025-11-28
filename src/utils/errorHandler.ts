/**
 * 友好的错误处理工具
 * 将技术错误转换为用户友好的提示信息
 */
export function getFriendlyErrorMessage(error: unknown, t: (key: string) => string): string {
  if (!error) {
    return t('messages.unknownError');
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStr = errorMessage.toLowerCase();

  // 助记词相关错误
  if (errorStr.includes('invalid') || errorStr.includes('无效') || errorStr.includes('mnemonic') || errorStr.includes('助记词')) {
    return t('messages.invalidMnemonicShort');
  }

  // 地址相关错误
  if (errorStr.includes('address') || errorStr.includes('地址')) {
    return t('messages.invalidAddress');
  }

  // 金额相关错误
  if (errorStr.includes('amount') || errorStr.includes('金额') || errorStr.includes('value')) {
    return t('messages.invalidAmount');
  }

  // 网络相关错误
  if (errorStr.includes('network') || errorStr.includes('网络') || errorStr.includes('fetch')) {
    return t('messages.unknownError') + ': ' + t('common.networkError') || 'Network error';
  }

  // 权限相关错误
  if (errorStr.includes('permission') || errorStr.includes('权限') || errorStr.includes('unauthorized')) {
    return t('messages.barcodeScannerNotAvailable');
  }

  // 用户取消操作
  if (errorStr.includes('cancel') || errorStr.includes('取消') || errorStr.includes('user_cancel')) {
    return ''; // 用户取消不显示错误
  }

  // 如果错误信息已经是友好的中文或英文提示，直接返回
  if (errorMessage.length < 100 && !errorMessage.includes('Error:') && !errorMessage.includes('at ')) {
    return errorMessage;
  }

  // 默认返回未知错误
  return t('messages.unknownError');
}

/**
 * 检查是否是用户取消操作
 */
export function isUserCancelError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStr = errorMessage.toLowerCase();
  return errorStr.includes('cancel') || errorStr.includes('取消') || errorStr.includes('user_cancel');
}

