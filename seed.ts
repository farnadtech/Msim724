
import { collection, addDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import { simCards, packages, transactions, users, admins } from './data/mockData';
import { User, Admin, SimCard, Package, Transaction } from './types';

// Function to remove undefined properties from an object
const removeUndefinedProps = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Seed users
  console.log('Seeding users...');
  for (const user of users) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'users'), user);
      console.log(`Added user ${user.name} with ID: ${docRef.id}`);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  // Seed admins
  console.log('Seeding admins...');
  for (const admin of admins) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'admins'), admin);
      console.log(`Added admin ${admin.name} with ID: ${docRef.id}`);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  // Seed simcards
  console.log('Seeding simcards...');
  for (const simCard of simCards) {
    try {
      const simCardData = removeUndefinedProps(simCard);
      const docRef = await addDoc(collection(db, 'sim_cards'), simCardData);
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
