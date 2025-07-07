import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.appspot.com",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add YouTube Channel
const channelForm = document.getElementById("channelForm");
channelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("channelTitle").value;
  const link = document.getElementById("channelLink").value;
  const reward = parseInt(document.getElementById("channelReward").value);
  await addDoc(collection(db, "channels"), { title, link, reward });
  alert("Channel added!");
  channelForm.reset();
  fetchChannels();
});

// Add Quiz Question
const questionForm = document.getElementById("questionForm");
questionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = document.getElementById("questionText").value;
  const options = {
    A: document.getElementById("optA").value,
    B: document.getElementById("optB").value,
    C: document.getElementById("optC").value,
    D: document.getElementById("optD").value,
  };
  const correct = document.getElementById("correctAnswer").value;
  const time = parseInt(document.getElementById("timeLimit").value);
  await addDoc(collection(db, "questions"), { question, options, correct, time });
  alert("Question added!");
  questionForm.reset();
  fetchQuestions();
});

// Fetch and Display Channels
async function fetchChannels() {
  const snapshot = await getDocs(collection(db, "channels"));
  const list = document.getElementById("channelList");
  list.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <p><strong>${data.title}</strong></p>
      <p><a href="${data.link}" target="_blank" style="color:#64ffda">${data.link}</a></p>
      <p>Reward: ${data.reward} Rwf</p>
      <button onclick="deleteChannel('${docSnap.id}')">Delete</button>
    `;
    list.appendChild(div);
  });
}
window.deleteChannel = async (id) => {
  await deleteDoc(doc(db, "channels", id));
  fetchChannels();
};

// Fetch and Display Questions
async function fetchQuestions() {
  const snapshot = await getDocs(collection(db, "questions"));
  const list = document.getElementById("questionList");
  list.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <p><strong>${data.question}</strong></p>
      <ul>
        <li>A: ${data.options.A}</li>
        <li>B: ${data.options.B}</li>
        <li>C: ${data.options.C}</li>
        <li>D: ${data.options.D}</li>
      </ul>
      <p>Correct: ${data.correct} | Time: ${data.time}s</p>
      <button onclick="deleteQuestion('${docSnap.id}')">Delete</button>
    `;
    list.appendChild(div);
  });
}
window.deleteQuestion = async (id) => {
  await deleteDoc(doc(db, "questions", id));
  fetchQuestions();
};

// Initial load
fetchChannels();
fetchQuestions();