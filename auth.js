import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore, doc, setDoc, query, where, getDocs, collection
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

const signupForm = document.getElementById("signup-form");
const messageEl = document.getElementById("message");

// Autofill referral code from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get("ref");
if (refCode) {
  signupForm.referral.value = refCode;
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signupForm.email.value.trim();
  const password = signupForm.password.value.trim();
  const referralInput = signupForm.referral.value.trim();

  messageEl.style.color = "black";
  messageEl.textContent = "Signing up...";

  try {
    let referralUID = null;

    if (referralInput) {
      // Lookup referral UID by referral code
      const q = query(collection(db, "users"), where("referralCode", "==", referralInput));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        referralUID = snapshot.docs[0].id;
      } else {
        messageEl.style.color = "red";
        messageEl.textContent = "Referral code not found.";
        return;
      }
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const referralCode = user.uid.slice(0, 6);

    // Wait for auth state fully active before Firestore write
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.uid === user.uid) {
        // Write user data without any rewards
        await setDoc(doc(db, "users", user.uid), {
          email,
          createdAt: new Date().toISOString(),
          referral: referralInput || null,
          referrerId: referralUID || null,
          referralCode,
          paymentConfirmed: false,
          role: "user",
          earned: 0,
          withdrawn: 0,
          referees: []
        });

        messageEl.style.color = "green";
        messageEl.textContent = "Signup successful! Redirecting to payment page...";
        setTimeout(() => {
          window.location.href = "payment.html";
        }, 2000);
      }
    });

  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Error: ${error.message}`;
  }
});