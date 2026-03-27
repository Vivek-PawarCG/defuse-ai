import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let db = null;

export const initFirestore = async () => {
  if (db) return db;

  // 1. Try Build-time Environment (Vite)
  let config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  // 2. Fallback: Fetch Runtime Config from Express Backend (Cloud Run Runtime)
  // This allows changing keys in Cloud Run console without a re-build.
  if (!config.apiKey) {
    try {
      const resp = await fetch('/api/config');
      const runtimeConfig = await resp.json();
      if (runtimeConfig.apiKey) config = runtimeConfig;
    } catch (e) {
      console.warn("Could not fetch runtime config.", e);
    }
  }

  if (!config.apiKey) {
    console.warn("Firebase config missing. Hall of Fame is offline.");
    return null;
  }

  try {
    const app = initializeApp(config);
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error("Firebase init error", e);
    return null;
  }
};

export const saveHighscore = async (username, score, time, difficulty) => {
  const database = await initFirestore();
  if (!database) return false;
  try {
    await addDoc(collection(database, "leaderboard"), {
      username: username.substring(0, 15),
      score: Number(score), // tiles cleared
      time: Number(time), // smaller is better if they cleared all
      difficulty: difficulty,
      date: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Error saving score", err);
    return false;
  }
};

export const fetchLeaderboard = async (difficulty) => {
  const database = await initFirestore();
  if (!database) return [];
  try {
    const q = query(
      collection(database, "leaderboard"),
      where("difficulty", "==", difficulty),
      orderBy("score", "desc"),
      orderBy("time", "asc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  } catch (err) {
    console.error("Error fetching leaderboard", err);
    return [];
  }
};
