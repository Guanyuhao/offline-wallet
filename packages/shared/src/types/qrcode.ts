/**
 * 二维码通信协议类型定义
 * 用于冷钱包和热钱包之间的数据交换
 */

/**
 * 二维码数据类型
 */
export enum QRCodeType {
  /** 地址二维码 */
  ADDRESS = 'address',
  /** 签名后的交易 */
  SIGNED_TRANSACTION = 'signed_tx',
  /** 未签名的交易（热钱包 -> 冷钱包） */
  UNSIGNED_TRANSACTION = 'unsigned_tx',
  /** 助记词（仅用于备份恢复） */
  MNEMONIC = 'mnemonic',
}

/**
 * 基础二维码数据结构
 */
export interface QRCodeBase {
  /** 类型 */
  type: QRCodeType;
  /** 版本号 */
  version: string;
  /** 时间戳 */
  timestamp: number;
  /** 链类型 */
  chain: 'eth' | 'btc' | 'sol' | 'bnb' | 'tron';
}

/**
 * 地址二维码数据
 */
export interface AddressQRCode extends QRCodeBase {
  type: QRCodeType.ADDRESS;
  /** 地址 */
  address: string;
  /** 地址标签（可选） */
  label?: string;
}

/**
 * 签名交易二维码数据
 */
export interface SignedTransactionQRCode extends QRCodeBase {
  type: QRCodeType.SIGNED_TRANSACTION;
  /** 签名后的交易数据（JSON字符串） */
  signedTx: string;
  /** 原始交易哈希（用于验证） */
  txHash: string;
}

/**
 * 未签名交易二维码数据（热钱包 -> 冷钱包）
 */
export interface UnsignedTransactionQRCode extends QRCodeBase {
  type: QRCodeType.UNSIGNED_TRANSACTION;
  /** 未签名的交易数据（JSON字符串） */
  unsignedTx: string;
  /** 交易说明 */
  description?: string;
}

/**
 * 助记词二维码数据（仅用于备份恢复，需要加密）
 */
export interface MnemonicQRCode extends QRCodeBase {
  type: QRCodeType.MNEMONIC;
  /** 加密后的助记词 */
  encryptedMnemonic: string;
}

/**
 * 二维码数据联合类型
 */
export type QRCodeData =
  | AddressQRCode
  | SignedTransactionQRCode
  | UnsignedTransactionQRCode
  | MnemonicQRCode;

/**
 * 二维码编码/解码工具
 */
export class QRCodeProtocol {
  private static readonly PROTOCOL_VERSION = '1.0.0';

  /**
   * 编码数据为JSON字符串（用于生成二维码）
   */
  static encode(data: QRCodeData): string {
    const payload = {
      ...data,
      version: this.PROTOCOL_VERSION,
      timestamp: Date.now(),
    };
    return JSON.stringify(payload);
  }

  /**
   * 解码JSON字符串为数据（从二维码扫描）
   */
  static decode(jsonString: string): QRCodeData {
    try {
      const data = JSON.parse(jsonString) as QRCodeData;

      // 验证版本
      if (data.version !== this.PROTOCOL_VERSION) {
        throw new Error(`Unsupported protocol version: ${data.version}`);
      }

      // 验证类型
      if (!Object.values(QRCodeType).includes(data.type)) {
        throw new Error(`Invalid type: ${data.type}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to decode QR code: ${error}`);
    }
  }

  /**
   * 验证二维码数据有效性
   */
  static validate(data: QRCodeData): boolean {
    if (!data.type || !data.chain || !data.version) {
      return false;
    }

    switch (data.type) {
      case QRCodeType.ADDRESS:
        return 'address' in data && typeof data.address === 'string';
      case QRCodeType.SIGNED_TRANSACTION:
        return 'signedTx' in data && 'txHash' in data;
      case QRCodeType.UNSIGNED_TRANSACTION:
        return 'unsignedTx' in data;
      case QRCodeType.MNEMONIC:
        return 'encryptedMnemonic' in data;
      default:
        return false;
    }
  }
}
