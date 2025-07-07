import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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

const paymentInstructions = document.getElementById("payment-instructions");
const loadingEl = document.getElementById("loading");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        loadingEl.textContent = "User data not found. Please contact support.";
        return;
      }

      const userData = userSnap.data();

      if (userData.paymentConfirmed) {
        // Redirect to dashboard if payment confirmed
        window.location.href = "dashboard.html";
      } else {
        // Show payment instructions
        loadingEl.classList.add("hidden");
        paymentInstructions.classList.remove("hidden");
      }
    } catch (error) {
      loadingEl.textContent = "Error loading user data.";
      console.error(error);
    }
  } else {
    // Not logged in, redirect to login
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

