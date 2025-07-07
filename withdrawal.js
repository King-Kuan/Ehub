import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
const db = getFirestore(app);

const withdrawalList = document.getElementById("withdrawalList");

async function loadWithdrawals() {
  const snapshot = await getDocs(collection(db, "withdrawals"));
  withdrawalList.innerHTML = "";

  snapshot.forEach(async (docSnap) => {
    const w = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${w.name}</strong><br>
        ${w.amount} RWF to ${w.number}<br>
        Status: <b>${w.approved ? "Approved" : "Pending"}</b>
      </div>
      <button ${w.approved ? "disabled" : ""} data-id="${docSnap.id}">
        Approve
      </button>
    `;

    const btn = li.querySelector("button");
    if (!w.approved) {
      btn.addEventListener("click", async () => {
        await updateDoc(doc(db, "withdrawals", btn.dataset.id), {
          approved: true
        });
        alert("Withdrawal approved!");
        loadWithdrawals();
      });
    }

    withdrawalList.appendChild(li);
  });
}

loadWithdrawals();

