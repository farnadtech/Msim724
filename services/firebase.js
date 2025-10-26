"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseConfig = exports.isFirebaseConfigured = exports.db = exports.auth = exports.app = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const firebaseConfig = {
    apiKey: "AIzaSyBlcCIqBAF6ERTyTVlRti8jSaUB-He8pZs",
    authDomain: "msim724-71635854-1c2c9.firebaseapp.com",
    projectId: "msim724-71635854-1c2c9",
    storageBucket: "msim724-71635854-1c2c9.firebasestorage.app",
    messagingSenderId: "262393700531",
    appId: "1:262393700531:web:6718e700664256cca590c6"
};
exports.firebaseConfig = firebaseConfig;
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.app = app;
const auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
const db = (0, firestore_1.getFirestore)(app);
exports.db = db;
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
exports.isFirebaseConfigured = isFirebaseConfigured;
