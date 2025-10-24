import { users, simCards, packages, transactions } from '../data/mockData';
import { User, SimCard, Package, Transaction } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Temporary store for registration OTPs
let pendingVerifications: Array<{
    identifier: string; // email or phone
    otp: string;
    expiry: number;
    details: { name: string; role: 'buyer' | 'seller'; email?: string; phoneNumber?: string; };
}> = [];

const OTP_LIFESPAN = 5 * 60 * 1000; // 5 minutes

// A helper to check if a string is a valid Iranian phone number
const isPhoneNumber = (str: string) => /^09\d{9}$/.test(str);
// A helper to check if a string is an email
const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);


// All functions here will now mutate the imported arrays, simulating a stateful backend.
const api = {
  // --- GETTERS (Read-only operations) ---
  getUsers: async (): Promise<User[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(users)); // Return a deep copy
  },

  getUserById: async (id: number): Promise<User | undefined> => {
    await delay(50);
    const user = users.find(u => u.id === id);
    return user ? JSON.parse(JSON.stringify(user)) : undefined;
  },

  getSimCards: async (): Promise<SimCard[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(simCards));
  },
  
  getSimCardById: async (id: string): Promise<SimCard | undefined> => {
    await delay(50);
    const sim = simCards.find(s => s.id === id);
    return sim ? JSON.parse(JSON.stringify(sim)) : undefined;
  },

  getPackages: async (): Promise<Package[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(packages));
  },

  getTransactions: async (): Promise<Transaction[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(transactions));
  },

  // --- NEW AUTH MUTATIONS ---
    requestLoginOtp: async (identifier: string): Promise<void> => {
        await delay(200);
        let userIndex = -1;
        if (isPhoneNumber(identifier)) {
            userIndex = users.findIndex(u => u.phoneNumber === identifier);
        } else if (isEmail(identifier)) {
            userIndex = users.findIndex(u => u.email === identifier);
        } else {
            throw new Error('لطفا ایمیل یا شماره موبایل معتبر وارد کنید.');
        }

        if (userIndex === -1) {
            throw new Error('کاربری با این مشخصات یافت نشد. لطفا ابتدا ثبت نام کنید.');
        }
        
        const otp = '1234'; // Mock OTP
        users[userIndex].otp = otp;
        users[userIndex].otpExpiry = new Date(Date.now() + OTP_LIFESPAN).toISOString();
        
        console.log(`[MeliPayamak SIMULATOR] Login OTP for ${identifier} is: ${otp}`);
    },

    verifyOtpAndLogin: async (identifier: string, otp: string): Promise<User> => {
        await delay(200);
        const user = users.find(u => (u.phoneNumber === identifier || u.email === identifier));
        
        if (!user || !user.otp || !user.otpExpiry) {
            throw new Error('خطای ورود. لطفا دوباره تلاش کنید.');
        }
        if (new Date(user.otpExpiry) < new Date()) {
            delete user.otp;
            delete user.otpExpiry;
            throw new Error('کد تایید منقضی شده است.');
        }
        if (user.otp !== otp) {
            throw new Error('کد تایید نامعتبر است.');
        }

        // Clean up OTP fields after successful verification
        delete user.otp;
        delete user.otpExpiry;

        return JSON.parse(JSON.stringify(user));
    },
    
    requestSignupOtp: async (details: { name: string; role: 'buyer' | 'seller'; email?: string; phoneNumber?: string; }): Promise<void> => {
        await delay(200);
        const identifier = details.phoneNumber || details.email;
        if (!identifier) {
            throw new Error('ایمیل یا شماره موبایل الزامی است.');
        }

        const query = details.phoneNumber 
          ? (u: User) => u.phoneNumber === details.phoneNumber
          : (u: User) => u.email === details.email;

        const existingUser = users.find(query);

        if (existingUser) {
            throw new Error('کاربری با این ایمیل یا شماره موبایل قبلا ثبت نام کرده است.');
        }
        
        const otp = '1234'; // Mock OTP
        const expiry = Date.now() + OTP_LIFESPAN;

        // Store pending verification details
        pendingVerifications = pendingVerifications.filter(p => p.identifier !== identifier); // remove old one if exists
        pendingVerifications.push({ identifier, otp, expiry, details });
        
        console.log(`[MeliPayamak SIMULATOR] Signup OTP for ${identifier} is: ${otp}`);
    },

    verifyOtpAndRegister: async (identifier: string, otp: string): Promise<User> => {
        await delay(200);
        const pending = pendingVerifications.find(p => p.identifier === identifier);
        if (!pending) {
            throw new Error('خطای ثبت نام. لطفا دوباره تلاش کنید.');
        }
        if (pending.expiry < Date.now()) {
            throw new Error('کد تایید منقضی شده است.');
        }
        if (pending.otp !== otp) {
            throw new Error('کد تایید نامعتبر است.');
        }

        // Create new user
        const newUser: User = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...pending.details,
            walletBalance: 0, // Initial balance
            blockedBalance: 0,
        };
        users.push(newUser);

        // Clean up pending verification
        pendingVerifications = pendingVerifications.filter(p => p.identifier !== identifier);

        return JSON.parse(JSON.stringify(newUser));
    },


  // --- MUTATIONS (Write operations) ---
  updateUser: async (userId: number, updatedData: Partial<User>): Promise<User> => {
    await delay(150);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('کاربر یافت نشد.');
    }
    // Make sure not to overwrite the whole object, just update fields
    users[userIndex] = { ...users[userIndex], ...updatedData };
    return JSON.parse(JSON.stringify(users[userIndex]));
  },

  updateSimCard: async (simId: string, updatedData: Partial<SimCard>): Promise<SimCard> => {
    await delay(150);
    const simIndex = simCards.findIndex(s => s.id === simId);
    if (simIndex === -1) {
        throw new Error('سیمکارت یافت نشد.');
    }
     // Handle nested auctionDetails
    if (updatedData.auctionDetails) {
        simCards[simIndex].auctionDetails = {
            ...simCards[simIndex].auctionDetails!,
            ...updatedData.auctionDetails
        };
        // remove it from updatedData to avoid overwriting the object
        delete updatedData.auctionDetails;
    }
    
    simCards[simIndex] = { ...simCards[simIndex], ...updatedData };
    return JSON.parse(JSON.stringify(simCards[simIndex]));
  },

  processTransaction: async (userId: number, amount: number, type: Transaction['type'], description: string): Promise<Transaction> => {
    await delay(150);
    const user = users.find(u => u.id === userId);
    if (!user) {
        throw new Error('کاربر یافت نشد.');
    }

    if (amount < 0 && user.walletBalance < Math.abs(amount)) {
        const message = type === 'withdrawal' ? 'موجودی کیف پول برای برداشت کافی نیست.' : 'موجودی کیف پول برای خرید کافی نیست.';
        throw new Error(message);
    }
    
    user.walletBalance += amount;
    
    const newTransaction: Transaction = {
        id: transactions.length + 1,
        userId,
        amount,
        type,
        description,
        date: new Date().toISOString()
    };
    transactions.push(newTransaction);
    return JSON.parse(JSON.stringify(newTransaction));
  },

  updateUserPackage: async (userId: number, packageId: number): Promise<User> => {
     await delay(100);
     const user = users.find(u => u.id === userId);
     if (!user) {
        throw new Error('کاربر یافت نشد.');
    }
    user.packageId = packageId;
    return JSON.parse(JSON.stringify(user));
  },

  addSimCard: async (simData: Omit<SimCard, 'id' | 'sellerId' | 'status'>, sellerId: number): Promise<SimCard> => {
    await delay(200);
    const seller = users.find(u => u.id === sellerId);
    if (!seller) throw new Error('فروشنده یافت نشد.');

    const userPackage = packages.find(p => p.id === seller.packageId);
    const activeListings = simCards.filter(s => s.sellerId === sellerId && s.status === 'available').length;

    if (!userPackage || activeListings >= userPackage.listingLimit) {
        throw new Error('محدودیت تعداد آگهی شما به پایان رسیده است. لطفا پکیج خود را ارتقا دهید.');
    }

    const ROND_FEE = 5000;
    if (simData.isRond) {
        if (seller.walletBalance < ROND_FEE) {
            throw new Error(`برای ثبت آگهی رند، موجودی کیف پول شما باید حداقل ${ROND_FEE.toLocaleString('fa-IR')} تومان باشد.`);
        }
        
        // Deduct fee and add transaction
        seller.walletBalance -= ROND_FEE;
        transactions.push({
            id: transactions.length + 1,
            userId: sellerId,
            amount: -ROND_FEE,
            type: 'purchase', // Using 'purchase' type for fee deduction
            description: `هزینه ثبت آگهی رند برای شماره ${simData.number}`,
            date: new Date().toISOString(),
        });
    }

    const newSim: SimCard = {
        ...simData,
        id: String(Date.now() + Math.random()), // more robust ID
        sellerId: sellerId,
        status: 'available',
        // Ensure bids array is initialized for new auctions
        auctionDetails: simData.auctionDetails ? { ...simData.auctionDetails, bids: [] } : undefined
    };
    simCards.push(newSim);
    return JSON.parse(JSON.stringify(newSim));
  },

  purchaseSim: async (simId: string, buyerId: number): Promise<void> => {
    await delay(300);
    const sim = simCards.find(s => s.id === simId);
    const buyer = users.find(u => u.id === buyerId);
    if (!sim || !buyer) {
        throw new Error('اطلاعات خرید نامعتبر است.');
    }
    if (sim.status === 'sold') {
        throw new Error('این سیمکارت قبلا فروخته شده است.');
    }
    
    const seller = users.find(u => u.id === sim.sellerId);
    if (!seller) {
        throw new Error('فروشنده یافت نشد.');
    }

    const price = sim.type === 'auction' && sim.auctionDetails ? sim.auctionDetails.currentBid : sim.price;
    let isAuctionWinner = sim.type === 'auction' && sim.auctionDetails?.highestBidderId === buyerId;

    if (isAuctionWinner) {
        if (buyer.blockedBalance < price) {
            throw new Error('مبلغ بلوکه شده برای تکمیل خرید کافی نیست. خطای سیستمی.');
        }
        buyer.blockedBalance -= price;
    } else if (sim.type === 'fixed') {
        if (buyer.walletBalance < price) {
            throw new Error('موجودی کیف پول شما برای خرید کافی نیست.');
        }
        buyer.walletBalance -= price;
    } else {
        throw new Error('این سیمکارت برای خرید در دسترس نیست.');
    }

    seller.walletBalance += price;
    sim.status = 'sold';
    sim.soldDate = new Date().toISOString();
    
    transactions.push({
        id: transactions.length + 1,
        userId: buyerId,
        type: 'purchase',
        amount: -price,
        date: new Date().toISOString(),
        description: `خرید سیمکارت ${sim.number}`,
    });
    transactions.push({
        id: transactions.length + 2,
        userId: seller.id,
        type: 'sale',
        amount: price,
        date: new Date().toISOString(),
        description: `فروش سیمکارت ${sim.number}`,
    });
  },

  placeBid: async (simId: string, bidderId: number, amount: number): Promise<void> => {
    await delay(250);
    const sim = simCards.find(s => s.id === simId);
    const bidder = users.find(u => u.id === bidderId);
    
    if (!sim || !bidder) {
        throw new Error('اطلاعات نامعتبر است.');
    }
    if (!sim.auctionDetails || sim.type !== 'auction') {
        throw new Error('این سیمکارت برای حراجی نیست.');
    }
    if (new Date(sim.auctionDetails.endTime) < new Date()) {
        throw new Error('زمان حراجی به پایان رسیده است.');
    }
    if (amount <= sim.auctionDetails.currentBid) {
        throw new Error('مبلغ پیشنهادی باید از بالاترین پیشنهاد فعلی بیشتر باشد.');
    }
    if (bidder.walletBalance < amount) {
        throw new Error('موجودی کیف پول شما برای این پیشنهاد کافی نیست.');
    }

    const previousBidAmount = sim.auctionDetails.currentBid;
    const prevHighestBidder = sim.auctionDetails.highestBidderId 
        ? users.find(u => u.id === sim.auctionDetails.highestBidderId) 
        : null;

    // Release previous bidder's funds
    if (prevHighestBidder) {
        // This check is important to prevent self-unblocking
        if (prevHighestBidder.id !== bidder.id) {
            prevHighestBidder.blockedBalance -= previousBidAmount;
            prevHighestBidder.walletBalance += previousBidAmount;
        } else {
            // User is just increasing their own bid, so we only need to block the difference
            const difference = amount - previousBidAmount;
            if (bidder.walletBalance < difference) {
                 throw new Error('موجودی شما برای افزایش پیشنهاد کافی نیست.');
            }
            bidder.walletBalance -= difference;
            bidder.blockedBalance += difference;
            
            // Update bid details
            sim.auctionDetails.currentBid = amount;
            sim.auctionDetails.bids.push({ userId: bidderId, amount: amount, date: new Date().toISOString() });
            return;
        }
    }

    // Block new bidder's funds
    bidder.walletBalance -= amount;
    bidder.blockedBalance += amount;
    
    // Update sim with new bid details
    sim.auctionDetails.currentBid = amount;
    sim.auctionDetails.highestBidderId = bidderId;
    sim.auctionDetails.bids.push({ userId: bidderId, amount: amount, date: new Date().toISOString() });
  },

  addPackage: async (packageData: Omit<Package, 'id'>): Promise<Package> => {
    await delay(150);
    const newPackage: Package = {
        id: packages.length > 0 ? Math.max(...packages.map(p => p.id)) + 1 : 1,
        ...packageData,
    };
    packages.push(newPackage);
    return JSON.parse(JSON.stringify(newPackage));
  },

  updatePackage: async (packageId: number, updatedData: Partial<Package>): Promise<Package> => {
    await delay(150);
    const packageIndex = packages.findIndex(p => p.id === packageId);
    if (packageIndex === -1) {
        throw new Error('پکیج یافت نشد.');
    }
    packages[packageIndex] = { ...packages[packageIndex], ...updatedData };
    return JSON.parse(JSON.stringify(packages[packageIndex]));
  },
};

export default api;