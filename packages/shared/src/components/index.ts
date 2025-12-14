/**
 * @Author liyongjie
 * Shared Components 导出
 */

export { default as AppLayout } from './AppLayout';
export { default as SplashScreen } from './SplashScreen';
export { default as ScanningFrame } from './ScanningFrame';
export { default as QRCodeDisplay } from './QRCodeDisplay';
export { default as QRCodeCard } from './QRCodeCard';
export { default as StandardCard } from './StandardCard';
export { default as PageLayout } from './PageLayout';
export { default as AddressDisplay } from './AddressDisplay';
export { default as ScanQRPage } from './ScanQRPage';
export { default as PrimaryButton } from './PrimaryButton';
export { default as ErrorBlock } from './ErrorBlock';
export { default as PasswordInput } from './PasswordInput';

// 动态表单
export * from './DynamicForm';

export type { AppLayoutProps } from './AppLayout';
export type { SplashScreenProps } from './SplashScreen';
export type { ScanningFrameProps } from './ScanningFrame';
export type { AddressDisplayProps } from './AddressDisplay';
export type { ScanQRPageProps, ScanQRPageTexts } from './ScanQRPage';
export type { PrimaryButtonProps } from './PrimaryButton';
export type { ErrorBlockProps, ErrorBlockTexts } from './ErrorBlock';
export type { PasswordInputProps } from './PasswordInput';
