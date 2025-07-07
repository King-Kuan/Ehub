import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
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

// Elements
const form = document.getElementById("uploadForm");
const toggleBtn = document.getElementById("toggleFormBtn");
const cancelBtn = document.getElementById("cancelBtn");
const messageEl = document.getElementById("message");
const videosContainer = document.getElementById("videosContainer");

toggleBtn.addEventListener("click", () => {
  form.style.display = "flex";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
});

cancelBtn.addEventListener("click", () => {
  form.style.display = "none";
  form.reset();
  messageEl.textContent = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const youtubeUrl = form.youtubeUrl.value.trim();
  const amount = Number(form.amount.value.trim());
  const watchTime = Number(form.watchTime.value.trim());
  const description = form.description.value.trim();
  const videoId = extractYouTubeID(youtubeUrl);

  if (!videoId) {
    messageEl.textContent = "Invalid YouTube URL.";
    messageEl.style.color = "red";
    return;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  try {
    await addDoc(collection(db, "videos"), {
      embedUrl,
      amount,
      watchTime,
      description,
      createdAt: Date.now()
    });

    messageEl.style.color = "green";
    messageEl.textContent = "Video uploaded!";
    form.reset();
    setTimeout(() => {
      form.style.display = "none";
      messageEl.textContent = "";
      loadVideos();
    }, 1200);
  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = "Error uploading: " + error.message;
  }
});

// Extracts video ID from various YouTube URL formats
function extractYouTubeID(url) {
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function loadVideos() {
  videosContainer.innerHTML = "";
  const snapshot = await getDocs(collection(db, "videos"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <iframe src="${data.embedUrl}" allowfullscreen></iframe>
      <div class="video-info">
        <div class="video-description">${data.description}</div>
        <div class="video-meta">Rwf ${data.amount} · ${data.watchTime} min</div>
        <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
      </div>
    `;
    videosContainer.appendChild(card);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "videos", id));
      loadVideos();
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadVideos();
  } else {
    window.location.href = "index.html";
  }
});