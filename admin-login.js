import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.firebasestorage.app",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f",
  measurementId: "G-HSZR82Y876"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("admin-login-form");
const messageEl = document.getElementById("message");
const forgotLink = document.getElementById("forgot-password-link");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();
  messageEl.textContent = "Logging in...";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("User data not found.");
    }

    const userData = docSnap.data();
    if (userData.role === "admin") {
      messageEl.style.color = "green";
      messageEl.textContent = "Login successful. Redirecting...";
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 2000);
    } else {
      throw new Error("Access denied: Not an admin.");
    }
  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Login failed: ${error.message}`;
  }
});

forgotLink.addEventListener("click", async () => {
  const email = prompt("Please enter your admin email to reset your password:");
  if (!email) return;

  messageEl.textContent = "Verifying admin email...";

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), where("role", "==", "admin"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No admin account found with this email.");
    }

    await sendPasswordResetEmail(auth, email);
    messageEl.style.color = "green";
    messageEl.textContent = "Password reset email sent. Please check your inbox.";
  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Error: ${error.message}`;
  }
});