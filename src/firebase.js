import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            "AIzaSyCm5LA2BAd8IKD19mrUOCxxPsagBdSjDD4",
  authDomain:        "polla-mundial-2026-87104.firebaseapp.com",
  databaseURL:       "https://polla-mundial-2026-87104-default-rtdb.firebaseio.com",
  projectId:         "polla-mundial-2026-87104",
  storageBucket:     "polla-mundial-2026-87104.firebasestorage.app",
  messagingSenderId: "173378785095",
  appId:             "1:173378785095:web:98a7931f63ff28abc10662",
  measurementId:     "G-GJ2FS76QE8",
};

export const FB_READY =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.databaseURL);

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
