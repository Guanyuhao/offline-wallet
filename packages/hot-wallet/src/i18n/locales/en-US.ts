/**
 * Hot Wallet Internationalization Text (English)
 */
export default {
  // Common
  common: {
    success: 'Success',
    failed: 'Failed',
    copied: 'Copied',
    loading: 'Loading...',
    empty: 'No Data',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
  },

  // Error Messages
  errors: {
    network: 'Network connection failed, please check and retry',
    rpc: 'Node request failed, please try again later',
    parse: 'Data parsing failed',
    rateLimit: 'Too many requests, please try again later',
    retry: 'Retry',
    unknown: 'Unknown error',
  },

  // Home
  home: {
    title: 'Hot Wallet',
    subtitle: 'Watch Wallet',
    description: 'Online watch wallet for balance queries and transaction broadcasting',
    addAddress: 'Add Watch Address',
    noAddress: 'No Watch Address',
    noAddressDesc: 'Please add cold wallet address to watch',
    scanQRCode: 'Scan QR Code',
  },

  // Watch Address
  watchAddress: {
    title: 'Add Watch Address',
    addByQR: 'Scan QR Code',
    addManually: 'Manual Input',
    scanHint: 'Scan cold wallet address QR code',
    inputHint: 'Wallet Address',
    inputPlaceholder: 'Enter address, auto-detect network',
    selectChain: 'Please select network',
    addSuccess: 'Added Successfully',
    addFailed: 'Failed to Add',
    invalidAddress: 'Unrecognized address format',
    addressExists: 'Address Already Exists',
    label: 'Address Label (Optional)',
    labelPlaceholder: 'Give this address a name',
    detectedNetwork: 'Detected Network',
    selectNetwork: 'Possible networks (please select)',
  },

  // Address Detail
  addressDetail: {
    title: 'Address Detail',
    balance: 'Balance',
    tokens: 'Token Balances',
    address: 'Address',
    transactions: 'Transactions',
    recent10: 'Recent 10',
    noTransactions: 'No Transactions',
    loadingBalance: 'Loading Balance...',
    loadingTransactions: 'Loading Transactions...',
    refreshBalance: 'Refresh Balance',
    viewOnExplorer: 'View on Explorer',
    sendTransaction: 'Send Transaction',
    removeAddress: 'Remove Address',
    confirmRemove: 'Are you sure to remove this watch address?',
  },

  // Send Transaction
  send: {
    title: 'Send Transaction',
    from: 'From',
    to: 'To',
    toRequired: 'Please enter recipient address',
    toPlaceholder: 'Enter recipient address',
    amount: 'Amount',
    amountRequired: 'Please enter amount',
    amountPlaceholder: 'Enter amount',
    memo: 'Memo',
    memoPlaceholder: 'Optional',
    gasPrice: 'Gas Price',
    gasPriceRequired: 'Please enter Gas Price',
    gasLimit: 'Gas Limit',
    gasLimitRequired: 'Please enter Gas Limit',
    nonce: 'Nonce',
    nonceRequired: 'Please enter Nonce',
    fee: 'Fee',
    gasParams: 'Gas Parameters',
    refresh: 'Refresh',
    buildTransaction: 'Build Transaction',
    buildSuccess: 'Transaction Built Successfully',
    buildFailed: 'Failed to Build Transaction',
    invalidAddress: 'Invalid recipient address',
    invalidAmount: 'Invalid amount',
    insufficientBalance: 'Insufficient balance',
    scanWithColdWallet: 'Please scan this QR code with cold wallet to sign',
    unsignedTransaction: 'Unsigned Transaction',
    showQRCode: 'Show QR Code',
    scanSigned: 'Scan Signed',
    txSummary: 'Transaction Summary',
    sendTo: 'Send',
    nextStep: 'Next: Scan Signed TX',
    paste: 'Paste',
    scan: 'Scan',
    clipboardEmpty: 'Clipboard is empty',
    chainMismatch: 'Chain type mismatch',
    scanAddressHint: 'Scan recipient address QR code',
  },

  // Scan Signed Transaction
  scanSigned: {
    title: 'Scan Signed Transaction',
    scanHint: 'Please scan the signed transaction QR code from cold wallet',
    broadcasting: 'Broadcasting...',
    verifying: 'Verifying...',
    scanSuccess: 'Scan Successful',
    scanFailed: 'Scan Failed',
    invalidQR: 'Invalid signed transaction QR code',
    chainMismatch: 'Chain type mismatch',
    signedTxReceived: 'Signed transaction received',
    rescan: 'Rescan',
    signExpired: 'Signature expired (valid for 1 min), please sign again',
  },

  // Broadcast Result
  broadcast: {
    title: 'Broadcast Result',
    success: 'Transaction Broadcasted Successfully!',
    failed: 'Failed to Broadcast Transaction',
    txHash: 'Transaction Hash',
    viewOnExplorer: 'View on Explorer',
    backToHome: 'Back to Home',
    retry: 'Retry',
    broadcast: 'Broadcast',
  },

  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    clearCache: 'Clear Data',
    clearCacheDesc: 'Clear all watch addresses',
    confirmClear: 'Are you sure to clear all data? This cannot be undone',
    clearSuccess: 'Data Cleared',
    exitApp: 'Exit App',
    confirmExit: 'Are you sure to exit?',
    about: 'About',
    version: 'Hot Wallet v1.0.0',
    slogan: 'Secure and Convenient Watch Wallet',
  },

  // Language
  language: {
    zhCN: '简体中文',
    enUS: 'English',
  },

  // Theme
  theme: {
    light: 'Light',
    dark: 'Dark',
    auto: 'System',
  },

  // Scan QR Code
  scanQR: {
    title: 'Scan QR Code',
    configError: 'Scan Configuration Error',
    enterCorrectly: 'Please enter scan page from correct entry',
    orRetry: 'or go back and retry',
    goBack: 'Go Back',
  },
};
