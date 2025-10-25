
import { db } from './firebase';
import { User, SimCard, Package, Transaction, Bid } from '../types';
import { 
    collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch, setDoc 
} from 'firebase/firestore';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    UserCredential
} from 'firebase/auth';

const auth = getAuth();

// --- Auth and User Management ---

export const signup = async (email: string, password: string): Promise<UserCredential> => {
    return await createUserWithEmailAndPassword(auth, email, password);
};

export const createUserProfile = async (userId: string, data: Omit<User, 'id'>): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
        id: userId,
        ...data
    });
};

export const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as User;
    }
    return null;
};

export const getUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => doc.data() as User);
};

export const updateUser = async (userId: string, updatedData: Partial<User>): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updatedData);
};

export const updateUserPackage = async (userId: string, packageId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { package_id: packageId });
};

// --- SIM Card Management ---

export const getSimCards = async (): Promise<SimCard[]> => {
    const simCardsCol = collection(db, 'sim_cards');
    const simCardSnapshot = await getDocs(simCardsCol);
    return simCardSnapshot.docs.map(doc => doc.data() as SimCard);
};

export const addSimCard = async (simData: Omit<SimCard, 'id'>): Promise<string> => {
    const simCardsCol = collection(db, 'sim_cards');
    const docRef = await addDoc(simCardsCol, simData);
    return docRef.id;
};

export const updateSimCard = async (simId: string, updatedData: Partial<SimCard>): Promise<void> => {
    const simCardDocRef = doc(db, 'sim_cards', simId);
    await updateDoc(simCardDocRef, updatedData);
};

// --- Package Management ---

export const getPackages = async (): Promise<Package[]> => {
    const packagesCol = collection(db, 'packages');
    const packageSnapshot = await getDocs(packagesCol);
    return packageSnapshot.docs.map(doc => doc.data() as Package);
};

export const addPackage = async (packageData: Omit<Package, 'id'>): Promise<string> => {
    const packagesCol = collection(db, 'packages');
    const docRef = await addDoc(packagesCol, packageData);
    return docRef.id;
};

export const updatePackage = async (packageId: string, updatedData: Partial<Package>): Promise<void> => {
    const packageDocRef = doc(db, 'packages', packageId);
    await updateDoc(packageDocRef, updatedData);
};

// --- Transaction & Financials ---

export const getTransactions = async (): Promise<Transaction[]> => {
    const transactionsCol = collection(db, 'transactions');
    const transactionSnapshot = await getDocs(transactionsCol);
    return transactionSnapshot.docs.map(doc => doc.data() as Transaction);
};

export const processTransaction = async (userId: string, amount: number, type: Transaction['type'], description: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        throw new Error("User not found for transaction.");
    }

    const currentBalance = userDoc.data().wallet_balance || 0;
    if (amount < 0 && currentBalance < Math.abs(amount)) {
        throw new Error('موجودی کیف پول کافی نیست.');
    }

    const newBalance = currentBalance + amount;
    
    const transactionCol = collection(db, 'transactions');
    const newTransactionRef = doc(transactionCol);

    const batch = writeBatch(db);
    batch.update(userDocRef, { wallet_balance: newBalance });
    batch.set(newTransactionRef, {
        user_id: userId,
        type,
        amount,
        description,
        date: new Date().toISOString()
    });

    await batch.commit();
};


export const purchaseSim = async (simId: string, buyerId: string): Promise<void> => {
    const simDocRef = doc(db, 'sim_cards', simId);
    const simDoc = await getDoc(simDocRef);

    if (!simDoc.exists()) {
        throw new Error('SIM card not found.');
    }

    const sim = simDoc.data() as SimCard;
    if (sim.status === 'sold') {
        throw new Error('This SIM card has already been sold.');
    }

    const price = sim.type === 'auction' && sim.auction_details ? sim.auction_details.current_bid : sim.price;

    if (sim.type === 'auction' && sim.auction_details?.highest_bidder_id !== buyerId) {
        throw new Error('Only the highest bidder can purchase this auctioned SIM.');
    }

    await processTransaction(buyerId, -price, 'purchase', `خرید سیمکارت ${sim.number}`);
    await processTransaction(sim.seller_id, price, 'sale', `فروش سیمکارت ${sim.number}`);

    await updateSimCard(simId, { status: 'sold', sold_date: new Date().toISOString() });

    if (sim.type === 'auction' && sim.auction_details && sim.auction_details.bids.length > 0) {
        const batch = writeBatch(db);
        const otherBidders = sim.auction_details.bids.filter(b => b.user_id !== buyerId);

        for (const bid of otherBidders) {
            const bidderDocRef = doc(db, 'users', bid.user_id);
            const bidderDoc = await getDoc(bidderDocRef);
            if (bidderDoc.exists()) {
                const bidder = bidderDoc.data() as User;
                const newWalletBalance = (bidder.wallet_balance || 0) + bid.amount;
                const newBlockedBalance = (bidder.blocked_balance || 0) - bid.amount;
                batch.update(bidderDocRef, { 
                    wallet_balance: newWalletBalance,
                    blocked_balance: newBlockedBalance
                });
            }
        }
        await batch.commit();
    }
};

export const placeBid = async (simId: string, bidderId: string, amount: number): Promise<void> => {
    const simDocRef = doc(db, 'sim_cards', simId);
    const simDoc = await getDoc(simDocRef);

    if (!simDoc.exists() || simDoc.data().type !== 'auction' || !simDoc.data().auction_details) {
        throw new Error('Auction not found.');
    }

    const sim = simDoc.data() as SimCard;
    if (new Date(sim.auction_details.end_time) < new Date()) {
        throw new Error('این حراجی به پایان رسیده است.');
    }

    if (amount <= sim.auction_details.current_bid) {
        throw new Error(`پیشنهاد شما باید بیشتر از ${sim.auction_details.current_bid.toLocaleString('fa-IR')} تومان باشد.`);
    }

    const bidderDocRef = doc(db, 'users', bidderId);
    const bidderDoc = await getDoc(bidderDocRef);

    if (!bidderDoc.exists()) {
        throw new Error('Bidder not found.');
    }

    const bidder = bidderDoc.data() as User;
    if ((bidder.wallet_balance || 0) < amount) {
        throw new Error('موجودی کیف پول برای ثبت این پیشنهاد کافی نیست.');
    }

    const batch = writeBatch(db);

    // Unblock previous highest bidder's funds
    const previousHighestBidderId = sim.auction_details.highest_bidder_id;
    if (previousHighestBidderId && previousHighestBidderId !== bidderId) {
        const prevBidderDocRef = doc(db, 'users', previousHighestBidderId);
        const prevBidderDoc = await getDoc(prevBidderDocRef);
        if (prevBidderDoc.exists()) {
            const prevBidder = prevBidderDoc.data() as User;
            const amountToUnblock = sim.auction_details.current_bid;
            batch.update(prevBidderDocRef, {
                wallet_balance: (prevBidder.wallet_balance || 0) + amountToUnblock,
                blocked_balance: (prevBidder.blocked_balance || 0) - amountToUnblock
            });
        }
    }

    // Block new bidder's funds
    batch.update(bidderDocRef, {
        wallet_balance: (bidder.wallet_balance || 0) - amount,
        blocked_balance: (bidder.blocked_balance || 0) + amount,
    });

    // Update sim card auction details
    const newBid: Bid = { user_id: bidderId, amount: amount, date: new Date().toISOString() };
    const updatedBids = [...sim.auction_details.bids, newBid];
    const updatedAuctionDetails = {
        ...sim.auction_details,
        current_bid: amount,
        highest_bidder_id: bidderId,
        bids: updatedBids,
    };
    batch.update(simDocRef, { auction_details: updatedAuctionDetails });

    await batch.commit();
};

const api = {
    signup,
    login,
    requestPasswordReset,
    createUserProfile,
    getUserProfile,
    getUsers,
    updateUser,
    updateUserPackage,
    getSimCards,
    addSimCard,
    updateSimCard,
    getPackages,
    addPackage,
    updatePackage,
    getTransactions,
    processTransaction,
    purchaseSim,
    placeBid,
};

export default api;
