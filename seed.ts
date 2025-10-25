
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from './services/firebase'; // Assuming your config is here
import { users, simCards, packages, transactions } from './data/mockData';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedDatabase() {
  console.log('Seeding database...');

  // Seed users and create auth accounts
  console.log('Seeding users...');
  for (const user of users) {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password123'); // Using a default password
      const authUser = userCredential.user;
      console.log(`Created auth user for ${user.email}`);

      // Use the UID from Auth as the document ID in Firestore
      const userDocRef = doc(db, 'users', authUser.uid);
      await setDoc(userDocRef, {
          ...user,
          id: authUser.uid // Overwrite the mock ID with the real auth UID
      });
      console.log(`Added user ${user.name} to Firestore with ID ${authUser.uid}`);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User with email ${user.email} already exists in Auth. Skipping.`);
        // If user exists in Auth, still try to add them to firestore if not there.
        // This part would need more robust logic for a real app, e.g., checking if the doc exists.
        // For this seed script, we will assume if auth exists, firestore doc also exists.
      } else {
        console.error('Error creating user:', error);
      }
    }
  }

  // Seed simcards
  console.log('Seeding simcards...');
  for (const simCard of simCards) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'simcards'), simCard);
      console.log(`Added simcard ${simCard.number} with ID: ${docRef.id}`);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  // Seed packages
  console.log('Seeding packages...');
  for (const pkg of packages) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'packages'), pkg);
      console.log(`Added package ${pkg.name} with ID: ${docRef.id}`);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  // Seed transactions
  console.log('Seeding transactions...');
  for (const transaction of transactions) {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      console.log(`Added transaction ${transaction.description} with ID: ${docRef.id}`);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  console.log('Database seeding complete.');
}

seedDatabase();
