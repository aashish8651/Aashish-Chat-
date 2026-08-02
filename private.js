import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  set,
  onValue,
  remove
}
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBe5YHFmT1qmI0dLj2vsNzMapHoh6do3mU",
  authDomain: "aashish-chat.firebaseapp.com",
  databaseURL: "https://aashish-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aashish-chat",
  storageBucket: "aashish-chat.firebasestorage.app",
  messagingSenderId: "879314147015",
  appId: "1:879314147015:web:5c6ea4ee171941a79c90e2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");

const otherId = localStorage.getItem("chatWith");
const otherName = localStorage.getItem("chatWithName");
const otherPhoto = localStorage.getItem("chatWithPhoto");
document.getElementById("chatTitle").innerText = "💬 " + otherName;
if (otherPhoto) {
  document.getElementById("profilePhoto").src = otherPhoto;
}
const roomId = [myId, otherId].sort().join("_");

// Online Status
const myStatusRef = ref(db, "users/" + myId + "/status");
set(myStatusRef, "online");

window.addEventListener("beforeunload", () => {
  set(myStatusRef, "offline");
});

const otherStatusRef = ref(db, "users/" + otherId + "/status");

onValue(otherStatusRef, (snap) => {
  const status = snap.val();
  document.getElementById("userStatus").innerText =
    status === "online" ? "🟢 Online" : "⚫ Offline";
});

const messages = document.getElementById("messages");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const typing = document.getElementById("typing");

msg.addEventListener("input", () => {
  if (msg.value.trim() !== "") {
    set(ref(db, "typing/" + roomId + "/" + myId), myName);
  } else {
    remove(ref(db, "typing/" + roomId + "/" + myId));
  }
});
// Send Message
send.onclick = () => {
remove(ref(db, "typing/" + roomId + "/" + myId));
  if (msg.value.trim() === "") return;

  push(ref(db, "privateChats/" + roomId), {
  sender: myId,
  senderName: myName,
  text: msg.value,
  time: Date.now(),
  status: "sent"
});

  msg.value = "";
};

// Receive Messages
onChildAdded(ref(db, "privateChats/" + roomId), (snap) => {

  const m = snap.val();

  // Agar message dusre user ne bheja hai,
  // to uska status "seen" kar do.
  if (m.sender !== myId) {
    set(ref(db, "privateChats/" + roomId + "/" + snap.key + "/status"), "seen");
  }

  typing.innerText = "";

  if (!snap.exists()) return;

  const data = snap.val();

  for (const id in data) {
    if (id !== myId) {
      typing.innerText = "✍️ " + data[id] + " is typing...";
    }
  }

});
  const m = snap.val();

  const div = document.createElement("div");

  if (m.sender === myId) {
    div.style.textAlign = "right";
    div.innerHTML =
      `<span style="background:#4CAF50;color:white;padding:8px;border-radius:10px;display:inline-block;margin:5px;">${m.text}</span>`;
  } else {
    div.style.textAlign = "left";
    div.innerHTML =
`<span style="background:#4CAF50;color:white;padding:8px;border-radius:10px;display:inline-block;margin:5px;">
${m.text}<br>
<small>${m.status === "seen" ? "✓✓ Seen" : "✓ Sent"}</small>
</span>`;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});
