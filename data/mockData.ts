import { User, SimCard, Package, Transaction } from '../types';

export const users: User[] = [
  { id: 1, name: 'مدیر کل', role: 'admin', email: 'admin@msim724.com', walletBalance: 10000000, blockedBalance: 0, phoneNumber: '09121111111' },
  { id: 2, name: 'علی رضایی', role: 'seller', email: 'ali@example.com', walletBalance: 500000, packageId: 2, blockedBalance: 0, phoneNumber: '09122222222' },
  { id: 3, name: 'سارا محمدی', role: 'buyer', email: 'sara@example.com', walletBalance: 3000000, blockedBalance: 0 },
  { id: 4, name: 'رضا حسینی', role: 'seller', phoneNumber: '09124444444', walletBalance: 1200000, packageId: 3, blockedBalance: 0 }, // Phone only user
  { id: 5, name: 'فاطمه احمدی', role: 'buyer', email: 'fatemeh@example.com', walletBalance: 3295000, blockedBalance: 1705000, phoneNumber: '09125555555' },
];

export const simCards: SimCard[] = [
  { id: '1', number: '09121234567', price: 50000000, sellerId: 1, type: 'fixed', status: 'available', carrier: 'همراه اول', isRond: true },
  { id: '2', number: '09122223333', price: 0, sellerId: 2, type: 'auction', status: 'available', carrier: 'همراه اول', isRond: true, auctionDetails: { endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), currentBid: 780000, highestBidderId: 5, bids: [{userId: 5, amount: 780000, date: new Date(Date.now() - 60 * 60 * 1000).toISOString() }] } },
  { id: '3', number: '09351112222', price: 2500000, sellerId: 4, type: 'fixed', status: 'available', carrier: 'ایرانسل', isRond: false },
  { id: '4', number: '09128888888', price: 0, sellerId: 1, type: 'auction', status: 'available', carrier: 'همراه اول', isRond: true, auctionDetails: { endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), currentBid: 2500000, highestBidderId: undefined, bids: [] } },
  { id: '5', number: '09215006000', price: 1200000, sellerId: 4, type: 'fixed', status: 'sold', carrier: 'رایتل', isRond: false },
  { id: '6', number: '09031002030', price: 800000, sellerId: 2, type: 'fixed', status: 'available', carrier: 'ایرانسل', isRond: false },
  { id: '7', number: '09123456789', price: 30000000, sellerId: 1, type: 'fixed', status: 'available', carrier: 'همراه اول', isRond: false },
  { id: '8', number: '09127770077', price: 0, sellerId: 4, type: 'auction', status: 'available', carrier: 'همراه اول', isRond: true, auctionDetails: { endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), currentBid: 925000, highestBidderId: 5, bids: [{userId: 3, amount: 900000, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}, {userId: 5, amount: 925000, date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }] } },
  { id: '9', number: '09361002030', price: 0, sellerId: 2, type: 'inquiry', status: 'available', carrier: 'ایرانسل', isRond: false, inquiryPhoneNumber: '09021234567' },
];

export const packages: Package[] = [
    { id: 1, name: 'پکیج برنزی', price: 50000, durationDays: 30, listingLimit: 5, description: 'مناسب برای شروع و فروشندگان خرد.' },
    { id: 2, name: 'پکیج نقره ای', price: 120000, durationDays: 60, listingLimit: 15, description: 'بهترین گزینه برای فروشندگان فعال.' },
    { id: 3, name: 'پکیج طلایی', price: 250000, durationDays: 90, listingLimit: 50, description: 'برای فروشندگان حرفه‌ای با تعداد بالا.' },
];

export const transactions: Transaction[] = [
    {id: 1, userId: 3, type: 'deposit', amount: 500000, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'شارژ کیف پول'},
    {id: 2, userId: 2, type: 'purchase', amount: -120000, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), description: 'خرید پکیج نقره ای'},
    {id: 3, userId: 4, type: 'sale', amount: 1200000, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'فروش سیمکارت 09215006000'},
    {id: 4, userId: 3, type: 'purchase', amount: -250000, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'خرید سیمکارت 090000000'},
];