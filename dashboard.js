import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.appspot.com",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f",
  measurementId: "G-HSZR82Y876"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    const currentEarned = data.earned || 0;

    // Fetch withdrawals to sum total withdrawn
    const withdrawalQuery = query(
      collection(db, "withdrawals"),
      where("uid", "==", user.uid)
    );
    const withdrawalsSnap = await getDocs(withdrawalQuery);
    let totalWithdrawn = 0;

    withdrawalsSnap.forEach(doc => {
      const w = doc.data();
      totalWithdrawn += w.amount || 0;
    });

    // Display
    document.getElementById("earned").textContent = `Rwf ${currentEarned}`;
    document.getElementById("withdrawn").textContent = `Rwf ${totalWithdrawn}`;
    document.getElementById("totalEarned").textContent = `Rwf ${currentEarned + totalWithdrawn}`;
    document.getElementById("totalWithdrawn").textContent = `Rwf ${totalWithdrawn}`;

    const referralCode = data.referralCode || user.uid;
    const referralURL = `https://king-kuan.github.io/Ehub/index.html?ref=${referralCode}`;
    document.getElementById("referralLink").value = referralURL;
  }
});

// Copy referral link
window.copyReferral = () => {
  const input = document.getElementById("referralLink");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    alert("Referral link copied!");
  });
};

// Toggle floating menu
window.toggleMenu = () => {
  const menu = document.getElementById("floatingMenu");
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
};

// Sign out
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});