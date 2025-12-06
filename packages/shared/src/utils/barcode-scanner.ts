/**
 * @Author liyongjie
 * 二维码扫描工具函数
 * 支持 Tauri 2.0 多 WebView + 透明 Surface 方案
 */

/**
 * 加载二维码扫描模块（仅在移动端可用）
 * 使用条件导入避免桌面端构建错误
 */
let barcodeScannerModule: any = null;
let loadAttempted = false;

export async function loadBarcodeScanner() {
  // 如果已经尝试过加载，直接返回结果
  if (loadAttempted) {
    return barcodeScannerModule;
  }

  loadAttempted = true;

  try {
    // 检测是否在移动端环境（iOS/Android）
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 检查是否在 Tauri 环境中（通过检查全局对象）
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    console.log('[BarcodeScanner] 环境检测:', {
      isMobile,
      isTauri,
      userAgent: navigator.userAgent,
      hasTauriInternals: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
    });

    if (!isMobile && !isTauri) {
      console.log('[BarcodeScanner] 非移动端/Tauri环境，跳过加载');
      return null;
    }

    console.log('[BarcodeScanner] 开始加载扫描模块...', { isMobile, isTauri });

    // 尝试多种导入方式
    const importMethods = [
      // 方法1: 直接动态导入（最常用）
      async () => {
        console.log('[BarcodeScanner] 尝试方法1: 直接动态导入');
        return await import('@tauri-apps/plugin-barcode-scanner');
      },
      // 方法2: 使用 Function 构造函数（避免 Vite 静态分析）
      async () => {
        console.log('[BarcodeScanner] 尝试方法2: Function 构造函数');
        const dynamicImport = new Function('moduleName', 'return import(moduleName)');
        return await dynamicImport('@tauri-apps/plugin-barcode-scanner');
      },
      // 方法3: 使用字符串拼接（避免静态分析）
      async () => {
        console.log('[BarcodeScanner] 尝试方法3: 字符串拼接');
        const basePath = '@tauri-apps/';
        const pluginName = 'plugin-barcode-scanner';
        return await import(basePath + pluginName);
      },
    ];

    for (let i = 0; i < importMethods.length; i++) {
      try {
        const scannerModule = await importMethods[i]();
        console.log(`[BarcodeScanner] 方法 ${i + 1} 导入成功`, {
          hasScan: typeof scannerModule?.scan === 'function',
          hasCheckPermissions: typeof scannerModule?.checkPermissions === 'function',
          hasRequestPermissions: typeof scannerModule?.requestPermissions === 'function',
          moduleKeys: Object.keys(scannerModule || {}),
        });

        // 验证模块是否有必要的方法
        if (scannerModule && typeof scannerModule.scan === 'function') {
          console.log('[BarcodeScanner] ✅ 模块验证通过，包含 scan 方法');
          barcodeScannerModule = scannerModule;
          return scannerModule;
        } else {
          console.warn('[BarcodeScanner] ⚠️ 模块缺少 scan 方法', {
            hasModule: !!scannerModule,
            scanType: typeof scannerModule?.scan,
            allKeys: Object.keys(scannerModule || {}),
          });
        }
      } catch (importError: any) {
        console.error(`[BarcodeScanner] ❌ 方法 ${i + 1} 导入失败:`, {
          message: importError?.message,
          stack: importError?.stack,
          name: importError?.name,
          error: importError,
        });
        // 继续尝试下一种方法
      }
    }

    console.error('[BarcodeScanner] ❌ 所有导入方式都失败，模块可能未正确打包或插件未注册');
    return null;
  } catch (error: any) {
    // 模块不存在（桌面端）或加载失败
    console.error('[BarcodeScanner] ❌ 加载过程异常:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error,
    });
    return null;
  }
}

/**
 * 检查并请求相机权限（iOS/Android）
 */
export async function ensureCameraPermission(): Promise<boolean> {
  try {
    const scanModule = await loadBarcodeScanner();
    if (!scanModule) {
      return false;
    }

    // 检查权限状态
    const hasPermission = await scanModule.checkPermissions();
    if (hasPermission) {
      return true;
    }

    // 请求权限
    const granted = await scanModule.requestPermissions();
    return granted;
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
}

/**
 * 扫描二维码（带权限检查）
 */
export async function scanQRCode(): Promise<string | null> {
  try {
    const scanModule = await loadBarcodeScanner();
    if (!scanModule) {
      return null;
    }

    // 确保有相机权限
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) {
      throw new Error('相机权限被拒绝，请在设置中允许访问相机');
    }

    // 执行扫描
    const result = await scanModule.scan();
    return result?.content || null;
  } catch (error: any) {
    console.error('扫描失败:', error);
    throw error;
  }
}
