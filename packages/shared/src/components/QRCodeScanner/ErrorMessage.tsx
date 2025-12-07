/**
 * @Author liyongjie
 * 错误提示组件
 */

import React from 'react';
import { errorMessageStyle } from './styles';

export interface ErrorMessageProps {
  /**
   * 错误消息
   */
  message: string;
}

/**
 * 错误提示组件
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return <div style={errorMessageStyle}>{message}</div>;
};

export default ErrorMessage;
