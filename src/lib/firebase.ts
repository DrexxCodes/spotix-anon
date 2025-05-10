import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, doc } from "firebase/firestore"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Add a helper function to get a user's links collection reference
export const getUserLinksCollection = (userId: string) => {
  return collection(db, "users", userId, "anonymousLinks")
}

// Add a helper function to get a specific link document reference
export const getLinkDocRef = (userId: string, linkId: string) => {
  return doc(db, "users", userId, "anonymousLinks", linkId)
}

// Add a helper function to get messages collection for a link
export const getLinkMessagesCollection = (userId: string, linkId: string) => {
  return collection(db, "users", userId, "anonymousLinks", linkId, "messages")
}

// Add a helper function to get a specific message document reference
export const getMessageDocRef = (userId: string, linkId: string, messageId: string) => {
  return doc(db, "users", userId, "anonymousLinks", linkId, "messages", messageId)
}

export default app
