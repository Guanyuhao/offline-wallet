export default {
  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    delete: 'Delete',
    save: 'Save',
    edit: 'Edit',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
  },

  // Home
  home: {
    title: 'Cold Wallet',
    subtitle: 'Offline Wallet',
    createWallet: 'Create Wallet',
    importWallet: 'Import Wallet',
    unlockWallet: 'Unlock Wallet',
    checking: 'Checking...',
    description:
      'Completely offline cryptocurrency wallet\nEnsure your private keys are absolutely secure',
    securityTitle: 'Security Tips',
    securityTip1: 'Completely offline, no network access',
    securityTip2: 'Private keys never leave the device',
    securityTip3: 'Memory cleared immediately after signing',
  },

  // Create Wallet
  createWallet: {
    title: 'Create Wallet',
    generateMnemonic: 'Generate Mnemonic',
    backupMnemonic: 'Backup Mnemonic',
    confirmMnemonic: 'Confirm Mnemonic',
    setPassword: 'Set Password',
    passwordHint: 'Please set a strong password to protect your wallet',
    passwordPlaceholder: 'Enter password',
    confirmPasswordPlaceholder: 'Confirm password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    createSuccess: 'Wallet created successfully',
    createNewWallet: 'Create New Wallet',
    selectWordCount:
      'Please select the number of mnemonic words. Keep them safe as they cannot be recovered if lost.',
    wordCount: 'Mnemonic Word Count',
    wordCount12: '12 mnemonic words',
    wordCount12Desc: 'Recommended, easier to backup and remember',
    wordCount24: '24 mnemonic words',
    wordCount24Desc: 'Higher security, suitable for large assets',
    generateFailed: 'Generation failed:',
    backupWarning: '⚠️ Please write it down on paper, do not screenshot or copy to the internet',
    copyMnemonic: 'Copy Mnemonic',
    copiedToClipboard: 'Copied to clipboard',
    backupConfirmation:
      'I have securely backed up my mnemonic and understand that losing it will make the wallet irrecoverable',
    backupCompleted: 'I have completed the backup',
    confirmBackup: 'Please confirm you have securely backed up your mnemonic',
    passwordDescription:
      'Password is used to encrypt and store the mnemonic. Please remember it. Forgotten passwords cannot recover the wallet.',
    passwordInputPlaceholder: 'Enter password (at least 8 characters)',
    confirmPasswordInputPlaceholder: 'Confirm password',
    encrypting: 'Encrypting and saving mnemonic...',
  },

  // Import Wallet
  importWallet: {
    title: 'Import Wallet',
    enterMnemonic: 'Enter Mnemonic',
    mnemonicPlaceholder: 'Enter 12 or 24 word mnemonic, separated by spaces',
    invalidMnemonic: 'Invalid mnemonic format',
    setPassword: 'Set Password',
    importSuccess: 'Wallet imported successfully',
    importDescription: 'Enter your 12 or 24 word mnemonic',
    mnemonicInputPlaceholder: 'Enter mnemonic, separated by spaces',
    passwordInputPlaceholder: 'Set password (at least 8 characters)',
    importButton: 'Import Wallet',
    invalidWordCount: 'Mnemonic should be 12 or 24 words',
    verificationFailed: 'Verification failed:',
    encryptingMessage:
      'Encrypting and saving mnemonic, first save takes about 30-60 seconds, please wait...',
    importFailed: 'Import failed:',
  },

  // Unlock
  unlock: {
    title: 'Unlock Wallet',
    passwordPlaceholder: 'Enter password',
    unlockButton: 'Unlock',
    passwordError: 'Incorrect password or unlock failed',
    loadingMessage: 'Verifying password and loading wallet... (First load may take 30-60 seconds)',
    keyMismatch:
      'Key mismatch: Incorrect password or vault file incompatible with current parameters',
    enterPasswordPrompt: 'Please enter password to unlock your wallet',
    enterPassword: 'Enter password',
    unlockSuccess: 'Unlock successful',
    unlockFailed: 'Unlock failed:',
  },

  // Wallet Page
  wallet: {
    title: 'Wallet',
    myWallet: 'My Wallet',
    receive: 'Receive',
    send: 'Send',
    settings: 'Settings',
    balance: 'Balance',
    address: 'Address',
    copyAddress: 'Copy Address',
    addressCopied: 'Address copied',
    currentChain: 'Current Chain',
    receivePayment: 'Receive',
    signTransaction: 'Sign Transaction',
    lock: 'Lock',
    loading: 'Loading...',
    selectChain: 'Select Chain',
    confirmLock: 'Are you sure you want to lock the wallet?',
    getAddressFailed: 'Failed to get address:',
  },

  // Receive Page
  receive: {
    title: 'Receive',
    address: 'Wallet Address',
    qrCode: 'QR Code',
    copyAddress: 'Copy Address',
    addressCopied: 'Address copied',
    receiveTitle: 'Receive Address',
    addressLabel: 'Address',
  },

  // Sign Transaction
  signTransaction: {
    title: 'Sign Transaction',
    scanQR: 'Scan QR Code',
    enterData: 'Manual Input',
    transactionData: 'Transaction Data',
    dataPlaceholder: 'Enter or paste transaction data',
    sign: 'Sign',
    signing: 'Signing...',
    signSuccess: 'Signing successful',
    invalidData: 'Invalid transaction data format',
    currentChain: 'Current Chain',
    scanQRTab: 'Scan QR Code',
    scanQRDescription: 'Scan QR code from watch wallet',
    manualInputTab: 'Manual Input',
    manualInputDescription: 'Professional mode manual input',
    scanHint: 'Please scan the unsigned transaction QR code generated by the hot wallet',
    scanButton: 'Scan QR Code',
    verifiedSuccess: '✓ Transaction information verified successfully',
    reviewAndSign: 'Please review the transaction information and confirm signing',
    edit: 'Edit',
    viewInfo: 'View Info',
    qrTypeError: 'Incorrect QR code type, please scan an unsigned transaction QR code',
    qrParseError:
      'Invalid QR code format, please check if it is a valid unsigned transaction QR code',
    chainMismatch: 'Chain type mismatch, QR code is {qrChain}, current chain is {currentChain}',
    txDataParseError: 'Invalid transaction data format',
    txVerifiedSuccess: 'Transaction information verified successfully',
    scanCancelled: 'Scan cancelled',
    scanNotSupported: 'Current device does not support scanning',
    scanFailed: 'Scan failed:',
    signError: 'Sign failed:',
    signEmpty: 'Sign returned empty',
    qrGenerateFailed: 'QR code generation failed',
    formValidationFailed: 'Form validation failed, please check your input',
    unknownError: 'Unknown error',
  },

  // Sign Success
  signSuccess: {
    title: 'Sign Successful',
    description:
      'Signed transaction generated, please use hot wallet to scan QR code and broadcast transaction',
    scanHint: 'Scan this QR code with hot wallet',
    broadcastHint: 'Broadcast signed transaction to {chain} network',
    qrError: 'QR code generation failed, please check console logs',
    signedData: 'Signed data:',
    stepComplete: 'Signing Complete',
    stepCompleteDesc: 'Transaction signed in cold wallet',
    stepBroadcast: 'Hot Wallet Scan to Broadcast',
    stepBroadcastDesc:
      'Scan QR code above with hot wallet to broadcast signed transaction to blockchain',
    stepSuccess: 'Transaction Successful',
    stepSuccessDesc:
      'Transaction will appear on blockchain after successful broadcast and confirmation',
    resignButton: 'Sign Again',
  },

  // Scan QR
  scanQR: {
    title: 'Scan QR Code',
    configError: 'Scan configuration error',
    enterCorrectly: 'Please enter scan page from correct entry point',
    orRetry: 'Or go back and retry',
    goBack: 'Go Back',
  },

  // Transaction Form
  transactionForm: {
    recipientAddress: 'Recipient Address',
    recipientAddressRequired: 'Please enter recipient address',
    addressInvalid: 'Invalid address',
    addressValidating: 'Validating address...',
    addressTimeout: 'Address validation timeout',
    addressFormatInvalid: 'Invalid address format, please check if it is a valid {chain} address',
    addressValidationFailed: 'Address validation failed, please check address format',
    inputPlaceholder: 'Support manual input, paste or scan',
    paste: 'Paste',
    scan: 'Scan',
    amount: 'Amount',
    amountUnit: 'Unit',
    amountRequired: 'Please enter amount',
    amountInvalid: 'Please enter a valid number (up to 18 decimal places)',
    amountMustBePositive: 'Amount must be greater than 0',
    amountPrecisionError: 'Amount precision cannot exceed 18 decimal places',
    amountTooLarge: 'Amount too large, please check your input',
    gasPrice: 'Gas Price',
    gasPriceUnit: 'Unit: Gwei · Suggested range: 5 - 100',
    gasPriceRequired: 'Please enter Gas Price',
    gasPriceInvalid: 'Invalid Gas Price format',
    gasPriceFormatError: 'Invalid Gas Price format, cannot start or end with decimal point',
    gasPriceMultipleDecimal: 'Invalid Gas Price format, can only have one decimal point',
    gasPriceLeadingZero:
      'Invalid Gas Price format, please enter a valid number (cannot start with 0, unless it is 0 or 0.xxx)',
    gasPriceMustBePositive: 'Gas Price must be greater than 0',
    gasPriceMinimum: 'Minimum Gas Price is 0.000000001 Gwei (1 Wei)',
    gasPriceMaximum: 'Maximum Gas Price is 10000 Gwei, please check your input',
    gasPricePrecisionError: 'Gas Price precision cannot exceed 9 decimal places',
    gasLimit: 'Gas Limit',
    gasLimitSuggestion: 'Suggested range: 21000 - 500000',
    gasLimitRequired: 'Please enter Gas Limit',
    gasLimitInvalid:
      'Invalid Gas Limit format, please enter a valid positive integer (cannot start with 0, unless it is 0)',
    gasLimitMustBePositive:
      'Gas Limit must be at least 21000 (minimum requirement for normal transfers)',
    gasLimitMaximum: 'Maximum Gas Limit is 10000000, please check your input',
    nonce: 'Nonce',
    nonceSuggestion: 'Transaction sequence number (leave blank to auto-retrieve)',
    nonceRequired: 'Please enter Nonce',
    nonceInvalid:
      'Invalid Nonce format, please enter a valid non-negative integer (cannot start with 0, unless it is 0)',
    nonceMustBeNonNegative: 'Nonce must be a non-negative integer',
    nonceMaximum: 'Maximum Nonce is 4294967295, please check your input',
    enableEditMode: 'Enable Edit Mode',
    editModeHint: 'You can manually edit transaction information after entering professional mode',
    clipboardEmpty: 'Clipboard is empty or cannot be read',
    addressPasted: 'Address pasted and verified',
    pasteFailed: 'Paste failed:',
    scanAddressHint: 'Please align the recipient address QR code with the scanning frame',
    addressScanned: 'Address scanned and verified',
    scanNotSupportedManual:
      'Current device does not support scanning, please enter address manually',
  },

  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    lockWallet: 'Lock Wallet',
    lockWalletDesc: 'Lock Wallet',
    lockWalletConfirm: 'After locking, you will need to re-enter the password to unlock.',
    deleteWallet: 'Delete Wallet',
    deleteWalletDesc:
      'Deleting the wallet will clear all data. This operation cannot be undone! Please ensure you have backed up your mnemonic.',
    confirmDelete: 'Confirm Delete',
    deleteSuccess: 'Wallet deleted',
    deleteFailed: 'Delete failed',
    exitApp: 'Exit App',
    exitAppDesc: 'Exit App',
    confirmExit: 'Are you sure you want to exit the app?',
    exitFailed: 'Exit failed, please close the app manually',
    dangerZone: 'Danger Zone',
    dangerZoneDesc:
      'Deleting the wallet will permanently clear all data. Please ensure you have backed up your mnemonic.',
    appVersion: 'Cold Wallet v0.1.0',
    appSlogan: 'Completely Offline, Security First',
  },

  // Theme Options
  theme: {
    light: 'Light',
    dark: 'Dark',
    auto: 'Follow System',
  },

  // Language Options
  language: {
    zhCN: '中文',
    enUS: 'English',
  },
};
