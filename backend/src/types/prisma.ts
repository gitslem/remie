// Prisma enum types - defined here because Prisma client generation is incomplete

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  SCHOOL_FEE = 'SCHOOL_FEE',
  ACCEPTANCE_FEE = 'ACCEPTANCE_FEE',
  HOSTEL_FEE = 'HOSTEL_FEE',
  EXAM_FEE = 'EXAM_FEE',
  NIN_REGISTRATION = 'NIN_REGISTRATION',
  JAMB_FEE = 'JAMB_FEE',
  WAEC_FEE = 'WAEC_FEE',
  NECO_FEE = 'NECO_FEE',
  OTHER_GOVERNMENT = 'OTHER_GOVERNMENT',
  UTILITY = 'UTILITY',
  WALLET_FUNDING = 'WALLET_FUNDING',
  WITHDRAWAL = 'WITHDRAWAL',
  RRR_PAYMENT = 'RRR_PAYMENT',
  INTERNATIONAL_REMITTANCE = 'INTERNATIONAL_REMITTANCE',
  OTHER = 'OTHER',
}

export enum PaymentMethod {
  WALLET = 'WALLET',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  USSD = 'USSD',
  CRYPTO = 'CRYPTO',
  RRR = 'RRR',
}

export enum CryptoType {
  USDT = 'USDT',
  USDC = 'USDC',
  ETH = 'ETH',
  BTC = 'BTC',
}

// Re-export common Prisma types that might be used
export type User = any;
export type Payment = any;
export type Receipt = any;
export type RRRPayment = any;
