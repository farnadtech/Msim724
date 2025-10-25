import { supabase } from './supabaseClient';
import { User, SimCard, Package, Transaction, Bid, UserRole } from '../types';
import { users as mockUsers, simCards as mockSimCards, packages as mockPackages, transactions as mockTransactions } from '../data/mockData';

// Supabase uses snake_case, while our app uses camelCase.
// These helpers convert between the two conventions.

const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = (s: string) => {
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

const keysToCamel = function (o: any): any {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
    const n: {[key: string]: any} = {};
    Object.keys(o)
      .forEach((k) => {
        n[toCamel(k)] = keysToCamel(o[k]);
      });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }
  return o;
};

const keysToSnake = function (o: any): any {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
    const n: {[key: string]: any} = {};
    Object.keys(o)
      .forEach((k) => {
        n[toSnake(k)] = keysToSnake(o[k]);
      });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToSnake(i);
    });
  }
  return o;
};

const isPhoneNumber = (str: string) => /^09\d{9}$/.test(str);
const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);


const api = {
    // --- Getters ---
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw new Error(error.message);
        return keysToCamel(data);
    },

    async getSimCards(): Promise<SimCard[]> {
        // Supabase requires quoting columns named 'type'
        const { data, error } = await supabase.from('sim_cards').select('*, "type"');
        if (error) throw new Error(error.message);
        return keysToCamel(data);
    },

    async getPackages(): Promise<Package[]> {
        const { data, error } = await supabase.from('packages').select('*');
        if (error) throw new Error(error.message);
        return keysToCamel(data);
    },

    async getTransactions(): Promise<Transaction[]> {
        const { data, error } = await supabase.from('transactions').select('*, "type"');
        if (error) throw new Error(error.message);
        return keysToCamel(data);
    },
    
    async getUserProfile(authUserId: string): Promise<User | null> {
        const { data, error } = await supabase.from('users').select('*').eq('auth_user_id', authUserId).single();
        if (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
        return keysToCamel(data);
    },
    
    async getUserById(id: number): Promise<User | undefined> {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) {
            console.error("Error fetching user by id:", error);
            return undefined;
        }
        return keysToCamel(data);
    },

    // --- Auth ---
    async requestLoginOtp(identifier: string): Promise<void> {
        const options: { email?: string; phone?: string; options?: { emailRedirectTo: string } } = {};
        if (isEmail(identifier)) {
            options.email = identifier;
            // This is crucial to make the verification link work correctly in any environment (localhost, AI Studio, etc.)
            options.options = { emailRedirectTo: window.location.origin };
        } else if (isPhoneNumber(identifier)) {
            options.phone = identifier;
        } else {
            throw new Error("Please provide a valid email or phone number.");
        }
        
        // This method sends a magic link for emails by default.
        const { error } = await supabase.auth.signInWithOtp(options);
        if (error) throw new Error(error.message);
    },

    async verifyOtpAndLogin(identifier: string, otp: string): Promise<User> {
        const options: { email?: string; phone?: string; token: string, type: 'email' | 'sms'} = { token: otp, type: 'email' };
        if (isEmail(identifier)) {
            options.email = identifier;
            options.type = 'email';
        } else if (isPhoneNumber(identifier)) {
            options.phone = identifier;
            options.type = 'sms';
        } else {
            throw new Error("Invalid identifier.");
        }
        
        const { data: { user: authUser }, error } = await supabase.auth.verifyOtp(options);
        if (error) throw new Error(error.message);
        if (!authUser) throw new Error("Login failed.");

        const userProfile = await this.getUserProfile(authUser.id);
        if (!userProfile) throw new Error("User profile not found.");
        
        return userProfile;
    },

    async verifyOtpAndRegister(details: {identifier: string, otp: string, name: string, role: UserRole}): Promise<User> {
        const { identifier, name, role } = details;
        
        // With magic link, the user is already authenticated when this is called.
        // We just need their auth object.
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) throw new Error("Authentication failed. Please try the link again.");
        if (authUser.email !== identifier && authUser.phone !== identifier) {
            throw new Error("Identifier mismatch. Please start the registration process again.");
        }
        
        // Check if a profile already exists from seeded data by email or phone
        if (authUser.email || authUser.phone) {
             const { data: existingProfile, error: findError } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${authUser.email},phone_number.eq.${authUser.phone}`)
                .maybeSingle();
            
            if (findError) console.error("Error checking for existing profile:", findError.message);

            if (existingProfile) {
                // Link auth user to existing profile and return it
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('users')
                    .update({ auth_user_id: authUser.id })
                    .eq('id', existingProfile.id)
                    .select()
                    .single();
                
                if (updateError) throw new Error(`Failed to link auth user: ${updateError.message}`);
                return keysToCamel(updatedProfile);
            }
        }
        
        // If no profile exists, create a new one
        // Fallback: make the first user an admin
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const finalRole = (count === 0 || name === 'مدیر کل') ? 'admin' : role;
        
        const newUserProfile = {
            auth_user_id: authUser.id,
            name,
            role: finalRole,
            email: authUser.email,
            phone_number: authUser.phone,
            wallet_balance: 1000000, // Starting balance for new users
            blocked_balance: 0,
        };

        const { data, error: insertError } = await supabase.from('users').insert(newUserProfile).select().single();
        if (insertError) throw new Error(insertError.message);
        
        return keysToCamel(data);
    },
    
    // --- Data Manipulation ---
    async seedDatabase(): Promise<void> {
        // 0. Guard Clause: Check if DB is already seeded by looking at packages
        const { count: pkgCount, error: countError } = await supabase.from('packages').select('*', { count: 'exact', head: true });
        if (countError) throw new Error(`Could not check packages table: ${countError.message}`);
        if (pkgCount && pkgCount > 0) {
            throw new Error("Database has already been seeded. Aborting.");
        }

        // 1. Seed Packages (without IDs)
        const packagesToSeed = mockPackages.map(({ id, ...pkg }) => pkg);
        const { data: newPackagesData, error: pkgError } = await supabase
            .from('packages')
            .insert(keysToSnake(packagesToSeed))
            .select();
        if (pkgError) throw new Error(`Seeding packages failed: ${pkgError.message}`);
        const newPackages: Package[] = keysToCamel(newPackagesData);

        const packageIdMap: { [key: number]: number } = {};
        mockPackages.forEach((pkg, index) => {
            packageIdMap[pkg.id] = newPackages[index].id;
        });

        // 2. Seed Users (handling the pre-existing admin user)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Authentication is required to seed the database.");

        const { data: adminProfile, error: adminError } = await supabase.from('users').select('id').eq('auth_user_id', authUser.id).single();
        if (adminError || !adminProfile) throw new Error(`Could not find the admin user profile: ${adminError?.message}`);
        const adminDbId = adminProfile.id;

        // Filter out the admin from mock data to prevent duplicates
        const otherMockUsers = mockUsers.filter(u => u.role !== 'admin');
        const usersToInsert = otherMockUsers.map(({ id, authUserId, packageId, ...user }) => ({
            ...user,
            packageId: packageId ? packageIdMap[packageId] : undefined,
        }));
        
        const { data: newUsersData, error: userError } = await supabase
            .from('users')
            .insert(keysToSnake(usersToInsert))
            .select();
        if (userError) throw new Error(`Seeding users failed: ${userError.message}`);
        const newUsers: User[] = keysToCamel(newUsersData);
        
        // 3. Create the ID map for all users
        const userIdMap: { [key: number]: number } = {};
        // Map mock admin (id: 1) to the current user's database ID
        userIdMap[1] = adminDbId;
        // Map the other mock users to their new database IDs
        otherMockUsers.forEach((user, index) => {
            userIdMap[user.id] = newUsers[index].id;
        });

        // 4. Seed Sim Cards (with their own string IDs, but mapped seller/bidder IDs)
        const simCardsToSeed = mockSimCards.map(({ sellerId, auctionDetails, ...sim }) => {
            const newAuctionDetails = auctionDetails ? {
                ...auctionDetails,
                highestBidderId: auctionDetails.highestBidderId ? userIdMap[auctionDetails.highestBidderId] : undefined,
                bids: auctionDetails.bids.map(bid => ({
                    ...bid,
                    userId: userIdMap[bid.userId],
                }))
            } : undefined;

            return {
                ...sim,
                sellerId: userIdMap[sellerId],
                auctionDetails: newAuctionDetails,
            };
        });
        const { error: simError } = await supabase.from('sim_cards').insert(keysToSnake(simCardsToSeed));
        if (simError) throw new Error(`Seeding SIM cards failed: ${simError.message}`);

        // 5. Seed Transactions (without IDs, with mapped userIds)
        const transactionsToSeed = mockTransactions.map(({ id, userId, ...trans }) => ({
            ...trans,
            userId: userIdMap[userId],
        }));
        const { error: transError } = await supabase.from('transactions').insert(keysToSnake(transactionsToSeed));
        if (transError) throw new Error(`Seeding transactions failed: ${transError.message}`);
    },

    async processTransaction(userId: number, amount: number, type: Transaction['type'], description: string): Promise<void> {
        // Note: In a real app, this should be a DB transaction/RPC call for atomicity.
        const user = await this.getUserById(userId);
        if (!user) throw new Error("User not found");
        
        if (amount < 0 && user.walletBalance < Math.abs(amount)) {
            throw new Error("Insufficient funds.");
        }
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ wallet_balance: user.walletBalance + amount })
            .eq('id', userId);
            
        if (updateError) throw new Error(updateError.message);

        const { error: insertError } = await supabase
            .from('transactions')
            .insert({ user_id: userId, amount, "type": type, description });
            
        if (insertError) throw new Error(insertError.message);
    },

    async addSimCard(simData: Omit<SimCard, 'id' | 'sellerId' | 'status'>, sellerId: number): Promise<void> {
        // This is a simplified version. A real app would use an RPC for atomicity (fee deduction + insertion).
        const ROND_FEE = 5000;
        if (simData.isRond) {
            await this.processTransaction(sellerId, -ROND_FEE, 'purchase', `Fee for rond number ${simData.number}`);
        }
        
        const newSim = {
            id: crypto.randomUUID(), // Generate client-side UUID
            seller_id: sellerId,
            status: 'available',
            ...keysToSnake(simData),
        };

        const { error } = await supabase.from('sim_cards').insert(newSim);
        if (error) throw new Error(error.message);
    },

    async purchaseSim(simId: string, buyerId: number): Promise<void> {
        // This should be an RPC call in a production app to ensure atomicity.
        const {data: simData, error: simError} = await supabase.from('sim_cards').select('*, "type"').eq('id', simId).single();
        if (simError || !simData) throw new Error("SIM card not found.");
        
        const sim: SimCard = keysToCamel(simData);

        const price = sim.type === 'auction' && sim.auctionDetails ? sim.auctionDetails.currentBid : sim.price;
        
        // 1. Debit buyer
        await this.processTransaction(buyerId, -price, 'purchase', `خرید سیمکارت ${sim.number}`);
        
        // 2. Credit seller
        await this.processTransaction(sim.sellerId, price, 'sale', `فروش سیمکارت ${sim.number}`);

        // 3. Unblock funds for buyer if it was an auction
        if (sim.type === 'auction' && sim.auctionDetails) {
            const buyer = await this.getUserById(buyerId);
            if (!buyer) throw new Error("Buyer not found");
            const { error } = await supabase.from('users')
                .update({ blocked_balance: buyer.blockedBalance - sim.auctionDetails.currentBid })
                .eq('id', buyerId);
            if(error) throw new Error(error.message);
        }

        // 4. Update SIM status
        const { error } = await supabase
            .from('sim_cards')
            .update({ status: 'sold', sold_date: new Date().toISOString() })
            .eq('id', simId);
        
        if (error) throw new Error(error.message);
    },

    async placeBid(simId: string, bidderId: number, amount: number): Promise<void> {
        // This should be an RPC call in a production app to handle race conditions.
        const {data: simData, error: simError} = await supabase.from('sim_cards').select('*, "type"').eq('id', simId).single();
        if (simError || !simData) throw new Error("SIM card not found.");
        const sim: SimCard = keysToCamel(simData);

        const bidder = await this.getUserById(bidderId);

        if (!sim || !bidder || sim.type !== 'auction' || !sim.auctionDetails) throw new Error('Auction or user not found.');
        if (new Date(sim.auctionDetails.endTime) < new Date()) throw new Error('Auction has ended.');
        if (amount <= sim.auctionDetails.currentBid) throw new Error('Bid must be higher than current bid.');
        if (bidder.walletBalance < amount) throw new Error('Insufficient funds.');

        const previousHighestBidderId = sim.auctionDetails.highestBidderId;
        const previousBidAmount = sim.auctionDetails.currentBid;

        // Unblock previous highest bidder
        if (previousHighestBidderId) {
            const prevBidder = await this.getUserById(previousHighestBidderId);
            if (prevBidder) {
                await supabase.from('users').update({
                    wallet_balance: prevBidder.walletBalance + previousBidAmount,
                    blocked_balance: prevBidder.blockedBalance - previousBidAmount
                }).eq('id', prevBidder.id);
            }
        }
        
        // Block new bidder's amount
        await supabase.from('users').update({
            wallet_balance: bidder.walletBalance - amount,
            blocked_balance: bidder.blockedBalance + amount
        }).eq('id', bidder.id);

        // Update auction details
        sim.auctionDetails.currentBid = amount;
        sim.auctionDetails.highestBidderId = bidderId;
        const newBid: Bid = { userId: bidderId, amount, date: new Date().toISOString() };
        sim.auctionDetails.bids.push(newBid);

        const { error } = await supabase.from('sim_cards').update({ auction_details: sim.auctionDetails }).eq('id', simId);
        if (error) throw new Error(error.message);
    },

    async updateUserPackage(userId: number, packageId: number): Promise<void> {
        const { error } = await supabase.from('users').update({ package_id: packageId }).eq('id', userId);
        if (error) throw new Error(error.message);
    },
    
    async updateUser(userId: number, updatedData: Partial<User>): Promise<void> {
        const { error } = await supabase.from('users').update(keysToSnake(updatedData)).eq('id', userId);
        if (error) throw new Error(error.message);
    },
    
    async updateSimCard(simId: string, updatedData: Partial<SimCard>): Promise<void> {
        const { error } = await supabase.from('sim_cards').update(keysToSnake(updatedData)).eq('id', simId);
        if (error) throw new Error(error.message);
    },
    
    async addPackage(packageData: Omit<Package, 'id'>): Promise<void> {
        const { error } = await supabase.from('packages').insert(keysToSnake(packageData));
        if (error) throw new Error(error.message);
    },
    
    async updatePackage(packageId: number, updatedData: Partial<Package>): Promise<void> {
        const { error } = await supabase.from('packages').update(keysToSnake(updatedData)).eq('id', packageId);
        if (error) throw new Error(error.message);
    },
};

export default api;