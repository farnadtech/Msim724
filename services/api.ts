// Implemented a mock API service to manage users, SIM cards, packages, and transactions. 
// This resolves all module import errors and provides the necessary data-handling logic for the application.
import { User, SimCard, Package, Transaction, UserRole, Bid } from '../types';
import { 
    users as mockUsers, 
    simCards as mockSimCards, 
    packages as mockPackages, 
    transactions as mockTransactions 
} from '../data/mockData';

// --- Local In-Memory "Database" ---
// We create copies to avoid modifying the imported mock data directly,
// simulating a more realistic API where data is mutable.
let users: User[] = JSON.parse(JSON.stringify(mockUsers));
let simCards: SimCard[] = JSON.parse(JSON.stringify(mockSimCards));
let packages: Package[] = JSON.parse(JSON.stringify(mockPackages));
let transactions: Transaction[] = JSON.parse(JSON.stringify(mockTransactions));
let nextUserId = users.length + 1;
let nextSimId = simCards.length + 1;
let nextTransactionId = transactions.length + 1;
let nextPackageId = packages.length + 1;


// --- Helper Functions ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Implementation ---
const api = {
    // --- Getters ---
    async getUsers(): Promise<User[]> {
        await delay(200);
        return JSON.parse(JSON.stringify(users));
    },

    async getSimCards(): Promise<SimCard[]> {
        await delay(200);
        return JSON.parse(JSON.stringify(simCards));
    },

    async getPackages(): Promise<Package[]> {
        await delay(200);
        return JSON.parse(JSON.stringify(packages));
    },

    async getTransactions(): Promise<Transaction[]> {
        await delay(200);
        return JSON.parse(JSON.stringify(transactions));
    },

    async getUserById(id: number): Promise<User | undefined> {
        await delay(100);
        return users.find(u => u.id === id);
    },

    // --- Auth ---
    async requestLoginOtp(identifier: string): Promise<void> {
        await delay(500);
        const user = users.find(u => u.email === identifier || u.phoneNumber === identifier);
        if (!user) {
            throw new Error('کاربری با این مشخصات یافت نشد.');
        }
        // Simulate sending OTP by setting it on the user object
        user.otp = '1234';
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    },

    async verifyOtpAndLogin(identifier: string, otp: string): Promise<User> {
        await delay(500);
        const user = users.find(u => u.email === identifier || u.phoneNumber === identifier);
        if (!user) {
            throw new Error('کاربر یافت نشد.');
        }
        if (user.otp !== otp || !user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
            throw new Error('کد تایید نامعتبر یا منقضی شده است.');
        }
        user.otp = undefined;
        user.otpExpiry = undefined;
        return JSON.parse(JSON.stringify(user));
    },
    
    // --- Signup ---
    async requestSignupOtp(signupDetails: { name: string, role: 'buyer' | 'seller', email?: string, phoneNumber?: string }): Promise<void> {
        await delay(500);
        const identifier = signupDetails.email || signupDetails.phoneNumber;
        if (!identifier) {
            throw new Error('ایمیل یا شماره موبایل الزامی است.');
        }
        
        const existingUser = users.find(u => u.email === identifier || u.phoneNumber === identifier);
        if (existingUser) {
            throw new Error('کاربری با این ایمیل/شماره موبایل قبلا ثبت نام کرده است.');
        }

        // Create a temporary user object to hold signup data and OTP
        const tempUser: User = {
            id: -1, // Temporary ID
            name: signupDetails.name,
            role: signupDetails.role,
            email: signupDetails.email,
            phoneNumber: signupDetails.phoneNumber,
            walletBalance: 0,
            blockedBalance: 0,
            otp: '1234',
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
        // In a real scenario, you'd store this temporarily (e.g., Redis). Here we'll just add it to the user list with a temp flag.
        // For simplicity, we'll find it back by identifier. We'll store it on a temporary object.
        (window as any).tempUsers = (window as any).tempUsers || {};
        (window as any).tempUsers[identifier] = tempUser;
    },
    
    async verifyOtpAndRegister(identifier: string, otp: string): Promise<User> {
        await delay(500);
        const tempUser = (window as any).tempUsers?.[identifier];
        if (!tempUser) {
            throw new Error('اطلاعات ثبت نام یافت نشد. لطفا دوباره تلاش کنید.');
        }
        if (tempUser.otp !== otp || !tempUser.otpExpiry || new Date(tempUser.otpExpiry) < new Date()) {
            throw new Error('کد تایید نامعتبر یا منقضی شده است.');
        }

        const newUser: User = {
            id: nextUserId++,
            name: tempUser.name,
            role: tempUser.role,
            email: tempUser.email,
            phoneNumber: tempUser.phoneNumber,
            walletBalance: 0,
            blockedBalance: 0,
        };
        users.push(newUser);
        delete (window as any).tempUsers[identifier];

        return JSON.parse(JSON.stringify(newUser));
    },
    
    // --- Data Manipulation ---
    async processTransaction(userId: number, amount: number, type: Transaction['type'], description: string): Promise<void> {
        await delay(300);
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('کاربر یافت نشد.');
        }

        if (amount < 0 && (user.walletBalance < Math.abs(amount))) {
            throw new Error('موجودی کافی نیست.');
        }

        user.walletBalance += amount;

        const newTransaction: Transaction = {
            id: nextTransactionId++,
            userId,
            amount,
            type,
            description,
            date: new Date().toISOString()
        };
        transactions.push(newTransaction);
    },

    async addSimCard(simData: Omit<SimCard, 'id' | 'sellerId' | 'status'>, sellerId: number): Promise<void> {
        await delay(500);
        const seller = users.find(u => u.id === sellerId);
        if (!seller) {
            throw new Error('فروشنده یافت نشد.');
        }

        const ROND_FEE = 5000;
        if (simData.isRond) {
            if (seller.walletBalance < ROND_FEE) {
                throw new Error(`برای ثبت سیمکارت رند به ${ROND_FEE.toLocaleString('fa-IR')} تومان موجودی نیاز دارید.`);
            }
            seller.walletBalance -= ROND_FEE;
            transactions.push({
                id: nextTransactionId++,
                userId: seller.id,
                amount: -ROND_FEE,
                type: 'purchase',
                description: `هزینه ثبت سیمکارت رند ${simData.number}`,
                date: new Date().toISOString(),
            });
        }
        
        const newSim: SimCard = {
            id: String(nextSimId++),
            sellerId: seller.id,
            status: 'available',
            ...simData
        };
        simCards.push(newSim);
    },

    async purchaseSim(simId: string, buyerId: number): Promise<void> {
        await delay(600);
        const sim = simCards.find(s => s.id === simId);
        const buyer = users.find(u => u.id === buyerId);
        if (!sim || !buyer) {
            throw new Error('سیمکارت یا خریدار یافت نشد.');
        }
        const seller = users.find(u => u.id === sim.sellerId);
        if (!seller) {
            throw new Error('فروشنده این سیمکارت یافت نشد.');
        }
        if (sim.status !== 'available') {
            throw new Error('این سیمکارت دیگر برای فروش موجود نیست.');
        }

        const price = sim.type === 'auction' && sim.auctionDetails ? sim.auctionDetails.currentBid : sim.price;

        if (sim.type === 'auction' && sim.auctionDetails?.highestBidderId !== buyerId) {
            throw new Error('فقط برنده حراجی میتواند این سیمکارت را خریداری کند.');
        }

        if (buyer.walletBalance < price) {
            throw new Error('موجودی کیف پول شما برای خرید کافی نیست.');
        }

        // Transactions
        buyer.walletBalance -= price;
        seller.walletBalance += price;
        
        // Unblock any blocked balance for the auction winner
        if(sim.type === 'auction' && sim.auctionDetails) {
            buyer.blockedBalance -= sim.auctionDetails.currentBid;
        }

        sim.status = 'sold';
        sim.soldDate = new Date().toISOString();

        transactions.push({
            id: nextTransactionId++,
            userId: buyer.id,
            amount: -price,
            type: 'purchase',
            description: `خرید سیمکارت ${sim.number}`,
            date: new Date().toISOString()
        });
        transactions.push({
            id: nextTransactionId++,
            userId: seller.id,
            amount: price,
            type: 'sale',
            description: `فروش سیمکارت ${sim.number}`,
            date: new Date().toISOString()
        });
    },

    async placeBid(simId: string, bidderId: number, amount: number): Promise<void> {
        await delay(400);
        const sim = simCards.find(s => s.id === simId);
        const bidder = users.find(u => u.id === bidderId);
        
        if (!sim || !bidder || sim.type !== 'auction' || !sim.auctionDetails) {
            throw new Error('حراجی یا کاربر یافت نشد.');
        }
        if (new Date(sim.auctionDetails.endTime) < new Date()) {
            throw new Error('زمان این حراجی به پایان رسیده است.');
        }
        if (amount <= sim.auctionDetails.currentBid) {
            throw new Error('پیشنهاد شما باید از بالاترین پیشنهاد فعلی بیشتر باشد.');
        }
        if (bidder.walletBalance < amount) {
            throw new Error('موجودی کیف پول شما برای این پیشنهاد کافی نیست.');
        }

        const previousHighestBidder = users.find(u => u.id === sim.auctionDetails!.highestBidderId);
        if (previousHighestBidder) {
            // Unblock previous highest bidder's amount
            previousHighestBidder.walletBalance += sim.auctionDetails!.currentBid;
            previousHighestBidder.blockedBalance -= sim.auctionDetails!.currentBid;
        }

        // Block new bidder's amount
        bidder.walletBalance -= amount;
        bidder.blockedBalance += amount;

        sim.auctionDetails.currentBid = amount;
        sim.auctionDetails.highestBidderId = bidderId;
        const newBid: Bid = {
            userId: bidderId,
            amount,
            date: new Date().toISOString()
        };
        sim.auctionDetails.bids.push(newBid);
    },

    async updateUserPackage(userId: number, packageId: number): Promise<void> {
        await delay(200);
        const user = users.find(u => u.id === userId);
        if (user) {
            user.packageId = packageId;
        } else {
            throw new Error('کاربر یافت نشد.');
        }
    },
    
    async updateUser(userId: number, updatedData: Partial<User>): Promise<void> {
        await delay(200);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            users[userIndex] = { ...users[userIndex], ...updatedData };
        } else {
            throw new Error('User not found.');
        }
    },
    
    async updateSimCard(simId: string, updatedData: Partial<SimCard>): Promise<void> {
        await delay(200);
        const simIndex = simCards.findIndex(s => s.id === simId);
        if (simIndex > -1) {
            simCards[simIndex] = { ...simCards[simIndex], ...updatedData };
        } else {
            throw new Error('SimCard not found.');
        }
    },
    
    async addPackage(packageData: Omit<Package, 'id'>): Promise<void> {
        await delay(300);
        const newPackage: Package = {
            id: nextPackageId++,
            ...packageData
        };
        packages.push(newPackage);
    },
    
    async updatePackage(packageId: number, updatedData: Partial<Package>): Promise<void> {
        await delay(200);
        const pkgIndex = packages.findIndex(p => p.id === packageId);
        if (pkgIndex > -1) {
            packages[pkgIndex] = { ...packages[pkgIndex], ...updatedData };
        } else {
            throw new Error('Package not found.');
        }
    },

};

export default api;