import { supabase } from './supabaseClient';
import { User, SimCard, Package, Transaction, Bid } from '../types';
import { users as mockUsers, simCards as mockSimCards, packages as mockPackages, transactions as mockTransactions } from '../data/mockData';
import { User as AuthUser } from '@supabase/supabase-js';

// Helper function to handle Supabase errors
const handleSupabaseError = ({ error, data }: { error: any, data: any }, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        // Ensure we always throw an Error with a clear string message,
        // preventing "[object Object]" errors in the UI.
        const message = error.message && typeof error.message === 'string'
            ? error.message
            : JSON.stringify(error);
        throw new Error(`Supabase error during ${context}: ${message}`);
    }
    return data;
};


// --- Auth and User Management ---

const requestLoginOtp = async (identifier: string) => {
    const isEmail = identifier.includes('@');
    if (!isEmail) {
        throw new Error('ورود فقط با ایمیل امکان پذیر است.');
    }
    
    const { error } = await supabase.auth.signInWithOtp({
        email: identifier,
        options: {
            shouldCreateUser: true, // Allow new users to sign up this way
        },
    });

    if (error) {
        console.error('Error requesting OTP:', error);
        throw new Error('خطا در ارسال کد. لطفا دوباره تلاش کنید.');
    }
};

const verifyOtpAndLogin = async (identifier: string, otp: string): Promise<User> => {
    const isEmail = identifier.includes('@');
    if (!isEmail) {
        throw new Error('ورود فقط با ایمیل امکان پذیر است.');
    }
    const verificationData = { email: identifier, token: otp, type: 'email' as const };
    
    const { data: { session }, error } = await supabase.auth.verifyOtp(verificationData);

    if (error || !session?.user) {
        console.error('Error verifying OTP:', error);
        throw new Error('کد تایید نامعتبر است یا منقضی شده.');
    }

    const userProfile = await getUserProfile(session.user);
    if (!userProfile) {
        // If they successfully authenticated but have no profile, they need to sign up.
        // Sign them out to prevent a dangling auth session.
        await supabase.auth.signOut();
        throw new Error('پروفایل کاربری یافت نشد. لطفا ثبت نام کنید.');
    }
    return userProfile;
};

const verifyOtpAndRegister = async (registrationData: {
    name: string;
    identifier: string;
    role: 'buyer' | 'seller';
    otp: string;
}): Promise<User> => {
    const isEmail = registrationData.identifier.includes('@');
    if (!isEmail) {
        throw new Error('ثبت نام فقط با ایمیل امکان پذیر است.');
    }
    const verificationData = { email: registrationData.identifier, token: registrationData.otp, type: 'email' as const };
        
    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp(verificationData);

    if (verifyError || !session?.user) {
        throw new Error('کد تایید نامعتبر است یا منقضی شده.');
    }

    // After successful OTP verification, we ensure a profile exists and return it.
    let userProfile = await getUserProfile(session.user);

    // If profile does NOT exist, create it.
    if (!userProfile) {
        const newUserProfileData = {
            id: session.user.id, // Use the UUID from auth.users as the primary key
            name: registrationData.name,
            role: registrationData.role,
            email: registrationData.identifier,
        };

        const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([newUserProfileData])
            .select()
            .single();
        
        handleSupabaseError({ data: newProfile, error: insertError }, 'user registration');
        userProfile = newProfile;
    }
    
    if (!userProfile) {
        // This should be an impossible state, but as a safeguard:
        await supabase.auth.signOut();
        throw new Error("خطا در ایجاد یا بازیابی پروفایل کاربری پس از ثبت نام.");
    }

    return userProfile;
};


const getUserProfile = async (authUser: AuthUser): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
        console.error("Error fetching user profile:", error);
        throw new Error(error.message);
    }
    return data;
};

const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    return handleSupabaseError({data, error}, 'fetching users');
};

const updateUser = async (userId: string, updatedData: Partial<User>): Promise<User> => {
    const { data, error } = await supabase.from('users').update(updatedData).eq('id', userId).select().single();
    return handleSupabaseError({ data, error }, `updating user ${userId}`);
};

const updateUserPackage = async (userId: string, packageId: number): Promise<User> => {
    const { data, error } = await supabase.from('users').update({ package_id: packageId }).eq('id', userId).select().single();
    return handleSupabaseError({ data, error }, `updating package for user ${userId}`);
};

// --- SIM Card Management ---

const getSimCards = async (): Promise<SimCard[]> => {
    const { data, error } = await supabase.from('sim_cards').select('*');
    return handleSupabaseError({data, error}, 'fetching SIM cards');
};

const addSimCard = async (simData: Omit<SimCard, 'id' | 'seller_id' | 'status'>, sellerId: string) => {
    const ROND_FEE = 5000;
    
    const { data: seller, error: sellerError } = await supabase.from('users').select('*, packages(*)' as '*').eq('id', sellerId).single();
    if(sellerError || !seller) throw new Error('Seller not found.');

    const { count, error: activeSimsError } = await supabase.from('sim_cards').select('id', { count: 'exact', head: true }).eq('seller_id', sellerId).eq('status', 'available');
    if(activeSimsError) throw activeSimsError;
    
    const listingLimit = (seller as any).packages?.listing_limit ?? 0;
    if ((count ?? 0) >= listingLimit) {
        throw new Error(`شما به سقف ${listingLimit} آگهی فعال در پکیج خود رسیده اید.`);
    }

    if (simData.is_rond) {
        if ((seller.wallet_balance || 0) < ROND_FEE) {
            throw new Error(`موجودی برای ثبت سیمکارت رند کافی نیست. نیاز به ${ROND_FEE} تومان دارید.`);
        }
        await processTransaction(sellerId, -ROND_FEE, 'purchase', 'هزینه ثبت سیمکارت رند');
    }

    const newSimCardData = {
        ...simData,
        seller_id: sellerId,
        status: 'available' as const
    };
    
    const { data, error } = await supabase.from('sim_cards').insert([newSimCardData]).select().single();
    return handleSupabaseError({ data, error }, 'adding new SIM card');
};

const updateSimCard = async (simId: number, updatedData: Partial<SimCard>): Promise<SimCard> => {
    const { data, error } = await supabase.from('sim_cards').update(updatedData).eq('id', simId).select().single();
    return handleSupabaseError({ data, error }, `updating sim card ${simId}`);
};

// --- Package Management ---

const getPackages = async (): Promise<Package[]> => {
    const { data, error } = await supabase.from('packages').select('*');
    return handleSupabaseError({data, error}, 'fetching packages');
};

const addPackage = async (packageData: Omit<Package, 'id'>): Promise<Package> => {
    const { data, error } = await supabase.from('packages').insert([packageData]).select().single();
    return handleSupabaseError({ data, error }, 'adding new package');
};

const updatePackage = async (packageId: number, updatedData: Partial<Package>): Promise<Package> => {
    const { data, error } = await supabase.from('packages').update(updatedData).eq('id', packageId).select().single();
    return handleSupabaseError({ data, error }, `updating package ${packageId}`);
};

// --- Transaction & Financials ---

const getTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*');
    return handleSupabaseError({data, error}, 'fetching transactions');
};

const processTransaction = async (userId: string, amount: number, type: Transaction['type'], description: string): Promise<void> => {
    const { data: user, error: userError } = await supabase.from('users').select('wallet_balance, blocked_balance').eq('id', userId).single();
    if(userError) throw new Error("User not found for transaction.");

    const currentBalance = user.wallet_balance || 0;
    if (amount < 0 && currentBalance < Math.abs(amount)) {
        throw new Error('موجودی کیف پول کافی نیست.');
    }

    const { error: updateError } = await supabase.from('users').update({ wallet_balance: currentBalance + amount }).eq('id', userId);
    if(updateError) throw new Error('Failed to update user balance.');
    
    const newTransactionData = {
        user_id: userId,
        type,
        amount,
        description,
        date: new Date().toISOString()
    };
    
    const { error: transactionError } = await supabase.from('transactions').insert([newTransactionData]);
    
    if(transactionError) {
        // Rollback the balance update if transaction recording fails
        await supabase.from('users').update({ wallet_balance: currentBalance }).eq('id', userId);
        console.error('Supabase transaction insert error:', transactionError);
        throw new Error('Failed to record transaction.');
    }
};

const purchaseSim = async (simId: number, buyerId: string): Promise<void> => {
    const { data: sim, error: simError } = await supabase.from('sim_cards').select('*').eq('id', simId).single();
    if(simError || !sim) throw new Error('SIM card not found.');
    if(sim.status === 'sold') throw new Error('This SIM card has already been sold.');

    const price = sim.type === 'auction' && sim.auction_details ? sim.auction_details.current_bid : sim.price;
    if (sim.type === 'auction' && sim.auction_details?.highest_bidder_id !== buyerId) {
        throw new Error('Only the highest bidder can purchase this auctioned SIM.');
    }

    await processTransaction(buyerId, -price, 'purchase', `خرید سیمکارت ${sim.number}`);
    await processTransaction(sim.seller_id, price, 'sale', `فروش سیمکارت ${sim.number}`);

    await updateSimCard(simId, { status: 'sold', sold_date: new Date().toISOString() });
    
    if (sim.type === 'auction' && sim.auction_details && sim.auction_details.bids.length > 0) {
        const otherBidders = sim.auction_details.bids
            .filter(b => b.user_id !== buyerId)
            .reduce((acc, bid) => {
                if (!acc[bid.user_id] || bid.amount > acc[bid.user_id]) {
                    acc[bid.user_id] = bid.amount;
                }
                return acc;
            }, {} as {[key: string]: number});

        for (const [bidderId, blockedAmount] of Object.entries(otherBidders)) {
            const { data: bidder } = await supabase.from('users').select('*').eq('id', bidderId).single();
            if (bidder) {
                await updateUser(bidderId, {
                    wallet_balance: Number(bidder.wallet_balance || 0) + Number(blockedAmount),
                    blocked_balance: Number(bidder.blocked_balance || 0) - Number(blockedAmount),
                });
            }
        }
    }
};

const placeBid = async (simId: number, bidderId: string, amount: number): Promise<void> => {
    const { data: sim, error: simError } = await supabase.from('sim_cards').select('*').eq('id', simId).single();
    if (simError || !sim || sim.type !== 'auction' || !sim.auction_details) throw new Error('Auction not found.');
    if (new Date(sim.auction_details.end_time) < new Date()) throw new Error('این حراجی به پایان رسیده است.');

    if (amount <= sim.auction_details.current_bid) {
        throw new Error(`پیشنهاد شما باید بیشتر از ${sim.auction_details.current_bid.toLocaleString('fa-IR')} تومان باشد.`);
    }

    const { data: bidder, error: bidderError } = await supabase.from('users').select('*').eq('id', bidderId).single();
    if (bidderError || !bidder) throw new Error('Bidder not found.');
    
    if ((bidder.wallet_balance || 0) < amount) {
        throw new Error('موجودی کیف پول برای ثبت این پیشنهاد کافی نیست.');
    }
    
    const previousHighestBidderId = sim.auction_details.highest_bidder_id;
    if (previousHighestBidderId && previousHighestBidderId !== bidderId) {
        const { data: prevBidder } = await supabase.from('users').select('*').eq('id', previousHighestBidderId).single();
        if (prevBidder) {
            const amountToUnblock = sim.auction_details.current_bid;
            await updateUser(previousHighestBidderId, {
                wallet_balance: Number(prevBidder.wallet_balance || 0) + amountToUnblock,
                blocked_balance: Number(prevBidder.blocked_balance || 0) - amountToUnblock
            });
        }
    }
    
    await updateUser(bidderId, {
        wallet_balance: Number(bidder.wallet_balance || 0) - amount,
        blocked_balance: Number(bidder.blocked_balance || 0) + amount,
    });
    
    const newBid: Bid = { user_id: bidderId, amount: amount, date: new Date().toISOString() };
    const updatedBids = [...sim.auction_details.bids, newBid];
    
    const updatedAuctionDetails = {
        ...sim.auction_details,
        current_bid: amount,
        highest_bidder_id: bidderId,
        bids: updatedBids,
    };
    
    await updateSimCard(simId, { auction_details: updatedAuctionDetails });
};


// --- Database Seeding ---

const seedDatabase = async () => {
    await supabase.from('transactions').delete().neq('id', 0);
    await supabase.from('sim_cards').delete().neq('id', 0);
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('packages').delete().neq('id', 0);

    const { error: pkgError } = await supabase.from('packages').insert(mockPackages);
    if(pkgError) throw pkgError;
    
    // In a real app, you would not seed users like this because the 'id' must match an auth.users.id
    // But for this mock setup, we insert them so FK relationships in other tables work.
    const { error: userError } = await supabase.from('users').insert(mockUsers);
    if(userError) throw userError;

    const { error: simError } = await supabase.from('sim_cards').insert(mockSimCards);
    if(simError) throw simError;
    
    const { error: transError } = await supabase.from('transactions').insert(mockTransactions);
    if(transError) throw transError;
};

const api = {
    requestLoginOtp,
    verifyOtpAndLogin,
    verifyOtpAndRegister,
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
    seedDatabase,
};

export default api;