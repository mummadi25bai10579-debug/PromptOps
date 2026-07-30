import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

// Read config
const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function test() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'mnr991299@gmail.com', 'password123'); // Wait, we can't do this easily since we don't know the password
    console.log('Logged in as:', cred.user.uid);
  } catch (e) {
    console.log('Auth failed:', e.message);
  }
}
test();
