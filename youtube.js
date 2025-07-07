import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc,
  getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.appspot.com",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const container = document.getElementById("videosContainer");
const earnedDisplay = document.getElementById("earnedDisplay");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.data() || {};
  updateEarned(data.earned || 0);
  await checkDailyStreak(user.uid, data);
  loadVideos(user.uid);
});

function updateEarned(amount) {
  earnedDisplay.textContent = `Earned: Rwf ${amount}`;
}

async function loadVideos(uid) {
  const watchedRef = doc(db, "watched", uid);
  const watchedSnap = await getDoc(watchedRef);
  const watchedData = watchedSnap.exists() ? watchedSnap.data() : {};
  const snapshot = await getDocs(collection(db, "videos"));
  container.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const video = docSnap.data();
    const videoId = docSnap.id;
    const lastWatched = watchedData[videoId]?.timestamp?.toMillis?.() || 0;
    const recentlyWatched = Date.now() - lastWatched < 86400000;

    const card = document.createElement("div");
    card.className = "video-card";

    const img = document.createElement("img");
    img.className = "video-thumbnail";
    img.src = `https://img.youtube.com/vi/${getVideoId(video.embedUrl)}/0.jpg`;

    if (!recentlyWatched) {
      img.addEventListener("click", () => openModal(video, videoId, uid));
    } else {
      const lockedOverlay = document.createElement("div");
      lockedOverlay.className = "locked-overlay";
      lockedOverlay.textContent = "Watched Today";
      card.appendChild(lockedOverlay);
    }

    card.appendChild(img);
    container.appendChild(card);
  });
}

function openModal(video, videoId, uid) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <div id="videoContainer"></div>
      <p>${video.description}</p>
      <p>Reward: Rwf ${video.amount} | Watch time: ${video.watchTime} minutes</p>
      <button id="startWatch">Start Watching</button>
      <p id="countdownText"></p>
    </div>
  `;

  document.body.appendChild(modal);

  const startBtn = modal.querySelector("#startWatch");
  const videoContainer = modal.querySelector("#videoContainer");

  startBtn.addEventListener("click", () => {
    startBtn.disabled = true;

    const iframe = document.createElement("iframe");
    iframe.src = `${video.embedUrl}?autoplay=1&mute=1`;
    iframe.allow = "autoplay; encrypted-media";
    iframe.allowFullscreen = true;
    iframe.width = "100%";
    iframe.height = "200";
    iframe.style.border = "none";
    videoContainer.appendChild(iframe);

    startCountdown(video, videoId, uid, modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function startCountdown(video, videoId, uid, modal) {
  let timeLeft = video.watchTime * 60;
  const countdownText = modal.querySelector("#countdownText");
  let hidden = false;

  const interval = setInterval(() => {
    if (document.hidden) hidden = true;
    if (hidden) {
      clearInterval(interval);
      modal.remove();
      alert("Skipping not allowed.");
      return;
    }

    countdownText.textContent = `Time left: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;
    timeLeft--;

    if (timeLeft <= 0) {
      clearInterval(interval);
      completeWatch(uid, videoId, video.amount, modal);
    }
  }, 1000);
}

async function completeWatch(uid, videoId, amount, modal) {
  const watchedRef = doc(db, "watched", uid);
  const userRef = doc(db, "users", uid);

  const watchedSnap = await getDoc(watchedRef);
  const watchedData = watchedSnap.exists() ? watchedSnap.data() : {};
  watchedData[videoId] = { timestamp: serverTimestamp() };
  await setDoc(watchedRef, watchedData);

  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};
  const earned = userData.earned || 0;
  await updateDoc(userRef, { earned: earned + amount });

  updateEarned(earned + amount);
  await updateStreak(uid);
  showToast("Reward added!");
  modal.remove();
  loadVideos(uid); // Refresh to block repeat
}

async function checkDailyStreak(uid, userData) {
  const today = new Date().toDateString();
  const lastStreak = userData.lastStreak || null;
  const currentStreak = userData.streak || 0;

  if (lastStreak !== today) {
    await updateDoc(doc(db, "users", uid), {
      lastStreak: today,
      streak: lastStreak === getYesterday() ? currentStreak + 1 : 1
    });
  }
}

async function updateStreak(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const today = new Date().toDateString();

  if (userData.lastStreak !== today) {
    const newStreak = userData.lastStreak === getYesterday()
      ? (userData.streak || 0) + 1
      : 1;
    await updateDoc(userRef, { lastStreak: today, streak: newStreak });
  }
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getVideoId(embedUrl) {
  const match = embedUrl.match(/\/embed\/([^/?]+)/);
  return match ? match[1] : "";
}