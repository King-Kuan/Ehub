import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("login-form");
const messageEl = document.getElementById("message");
const forgotPasswordLink = document.getElementById("forgot-password");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();
  messageEl.style.color = "black";
  messageEl.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      messageEl.style.color = "red";
      messageEl.textContent = "User data not found.";
      return;
    }

    const userData = userDoc.data();
    if (userData.paymentConfirmed) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "payment.html";
    }

  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Login failed: ${error.message}`;
  }
});

// Forgot password handler
forgotPasswordLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value.trim();

  if (!email) {
    messageEl.style.color = "red";
    messageEl.textContent = "Please enter your email in the login form first.";
    return;
  }

  messageEl.style.color = "black";
  messageEl.textContent = "Sending password reset email...";

  try {
    await sendPasswordResetEmail(auth, email);
    messageEl.style.color = "green";
    messageEl.textContent = `Password reset email sent to ${email}. Check your inbox.`;
  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Failed to send reset email: ${error.message}`;
  }
});