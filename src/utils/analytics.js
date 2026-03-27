import { getAnalytics, logEvent } from "firebase/analytics";
import { initFirestore, getFirebaseApp } from "./firebase.js";

let analytics = null;

export const initAnalytics = async () => {
  if (analytics) return analytics;
  
  await initFirestore();
  const app = getFirebaseApp();
  if (app) {
    try {
      analytics = getAnalytics(app);
      return analytics;
    } catch (e) {
      console.warn("Analytics initialization failed", e);
    }
  }
  return null;
};

export const trackEvent = async (eventName, params = {}) => {
  const instance = await initAnalytics();
  if (instance) {
    logEvent(instance, eventName, params);
  }
};
