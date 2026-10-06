import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsgU28OZpKDA4po0GwcLmpL63Gep4oi88",
  authDomain: "salha-app-e94d8.firebaseapp.com",
  projectId: "salha-app-e94d8",
  storageBucket: "salha-app-e94d8.firebasestorage.app",
  messagingSenderId: "478161892369",
  appId: "1:478161892369:android:0ef1f6649f5619180badb0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;