/**
 * 热钱包国际化文本（中文）
 */
export default {
  // 通用
  common: {
    success: '成功',
    failed: '失败',
    copied: '已复制',
    loading: '加载中...',
    empty: '暂无数据',
    back: '返回',
    cancel: '取消',
    confirm: '确定',
    delete: '删除',
  },

  // 错误提示
  errors: {
    network: '网络连接失败，请检查网络后重试',
    rpc: '节点请求失败，请稍后重试',
    parse: '数据解析失败',
    rateLimit: '请求过于频繁，请稍后重试',
    retry: '重试',
    unknown: '未知错误',
  },

  // 首页
  home: {
    title: '热钱包',
    subtitle: '观察钱包',
    description: '联网观察钱包，查询余额和广播交易',
    addAddress: '添加观察地址',
    noAddress: '暂无观察地址',
    noAddressDesc: '请添加冷钱包地址进行观察',
    scanQRCode: '扫描二维码',
  },

  // 观察地址
  watchAddress: {
    title: '添加观察地址',
    addByQR: '扫描二维码',
    addManually: '手动输入',
    scanHint: '扫描冷钱包的地址二维码',
    inputHint: '钱包地址',
    inputPlaceholder: '输入地址，自动识别网络',
    selectChain: '请选择网络',
    addSuccess: '添加成功',
    addFailed: '添加失败',
    invalidAddress: '无法识别的地址格式',
    addressExists: '地址已存在',
    label: '地址标签（可选）',
    labelPlaceholder: '给地址起个名字',
    detectedNetwork: '已识别网络',
    selectNetwork: '可能的网络（请选择）',
  },

  // 地址详情
  addressDetail: {
    title: '地址详情',
    balance: '余额',
    tokens: '代币余额',
    address: '地址',
    transactions: '交易记录',
    recent10: '最近10条',
    noTransactions: '暂无交易记录',
    loadingBalance: '加载余额中...',
    loadingTransactions: '加载交易中...',
    refreshBalance: '刷新余额',
    viewOnExplorer: '在区块浏览器查看',
    sendTransaction: '发起交易',
    removeAddress: '移除地址',
    confirmRemove: '确定移除此观察地址？',
  },

  // 发起交易
  send: {
    title: '发起交易',
    from: '发送地址',
    to: '接收地址',
    toRequired: '请输入接收地址',
    toPlaceholder: '输入接收地址',
    amount: '金额',
    amountRequired: '请输入金额',
    amountPlaceholder: '输入金额',
    memo: '备注',
    memoPlaceholder: '可选',
    gasPrice: 'Gas Price',
    gasPriceRequired: '请输入 Gas Price',
    gasLimit: 'Gas Limit',
    gasLimitRequired: '请输入 Gas Limit',
    nonce: 'Nonce',
    nonceRequired: '请输入 Nonce',
    fee: '手续费',
    gasParams: 'Gas 参数',
    refresh: '刷新',
    buildTransaction: '构建交易',
    buildSuccess: '交易构建成功',
    buildFailed: '交易构建失败',
    invalidAddress: '无效的接收地址',
    invalidAmount: '无效的金额',
    insufficientBalance: '余额不足',
    scanWithColdWallet: '请使用冷钱包扫描此二维码进行签名',
    unsignedTransaction: '未签名交易',
    showQRCode: '显示二维码',
    scanSigned: '扫描签名',
    txSummary: '交易摘要',
    sendTo: '发送',
    nextStep: '下一步：扫描签名',
    paste: '粘贴',
    scan: '扫描',
    clipboardEmpty: '剪贴板为空',
    chainMismatch: '链类型不匹配',
    scanAddressHint: '扫描接收地址二维码',
  },

  // 扫描签名交易
  scanSigned: {
    title: '扫描签名交易',
    scanHint: '请扫描冷钱包签名后的交易二维码',
    broadcasting: '正在广播...',
    verifying: '正在验证...',
    scanSuccess: '扫描成功',
    scanFailed: '扫描失败',
    invalidQR: '无效的签名交易二维码',
    chainMismatch: '链类型不匹配',
    signedTxReceived: '已获取签名交易',
    rescan: '重新扫描',
    signExpired: '签名已过期（有效期1分钟），请重新签名',
  },

  // 广播结果
  broadcast: {
    title: '广播结果',
    success: '交易广播成功！',
    failed: '交易广播失败',
    txHash: '交易哈希',
    viewOnExplorer: '在区块浏览器查看',
    backToHome: '返回首页',
    retry: '重新尝试',
    broadcast: '广播交易',
  },

  // 设置页面
  settings: {
    title: '设置',
    language: '语言',
    theme: '主题',
    clearCache: '清除数据',
    clearCacheDesc: '清除所有观察地址',
    confirmClear: '确定清除所有数据？此操作不可恢复',
    clearSuccess: '清除成功',
    exitApp: '退出应用',
    confirmExit: '确定退出应用？',
    about: '关于',
    version: '热钱包 v1.0.0',
    slogan: '安全便捷的观察钱包',
  },

  // 语言
  language: {
    zhCN: '简体中文',
    enUS: 'English',
  },

  // 主题
  theme: {
    light: '浅色',
    dark: '深色',
    auto: '跟随系统',
  },

  // 扫描二维码
  scanQR: {
    title: '扫描二维码',
    configError: '扫描配置错误',
    enterCorrectly: '请从正确的入口进入扫描页面',
    orRetry: '或返回重试',
    goBack: '返回',
  },
};
