export type UserRole = 'admin' | 'seller' | 'buyer';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  email?: string; // Now optional
  walletBalance: number;
  blockedBalance: number;
  phoneNumber?: string; // Already optional
  packageId?: number;
  // Temporary fields for OTP verification simulation
  otp?: string;
  otpExpiry?: string;
}

export type SimCardTypeOption = 'fixed' | 'auction' | 'inquiry';

export interface Bid {
  userId: number;
  amount: number;
  date: string;
}

export interface SimCard {
  id: string;
  number: string;
  price: number;
  sellerId: number;
  type: SimCardTypeOption;
  status: 'available' | 'sold';
  soldDate?: string;
  carrier: 'همراه اول' | 'ایرانسل' | 'رایتل';
  isRond: boolean;
  inquiryPhoneNumber?: string;
  auctionDetails?: {
    endTime: string;
    currentBid: number;
    highestBidderId?: number;
    bids: Bid[];
  };
}

export interface Package {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  listingLimit: number;
  description: string;
}

export interface Transaction {
    id: number;
    userId: number;
    type: 'deposit' | 'withdrawal' | 'purchase' | 'sale';
    amount: number;
    date: string;
    description: string;
}