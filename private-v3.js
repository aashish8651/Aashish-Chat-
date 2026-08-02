import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBe5YHFmT1qmI0dLj2vsNzMapHoh6do3mU",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL:                "https://aashish-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// User Data
const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");
const myPhoto = localStorage.getItem("myPhoto") || "";

const otherId = localStorage.getItem("chatWith");
const otherName = localStorage.getItem("chatWithName");
const otherPhoto = localStorage.getItem("chatWithPhoto") || "";

const roomId = [myId, otherId].sort().join("_");

// HTML Elements
const profilePhoto = document.getElementById("profilePhoto");
const chatTitle = document.getElementById("chatTitle");
const userStatus = document.getElementById("userStatus");

const messages = document.getElementById("messages");
const typing = document.getElementById("typing");

const msg = document.getElementById("msg");
const send = document.getElementById("send");

const image = document.getElementById("image");
const imageBtn = document.getElementById("imageBtn");

const audioCallBtn = document.getElementById("audioCallBtn");
const videoCallBtn = document.getElementById("videoCallBtn");

chatTitle.textContent = otherName;

if (otherPhoto) {
  profilePhoto.src = otherPhoto;
}
// ======================
// ONLINE STATUS
// ======================

const myStatusRef = ref(db, "users/" + myId);

update(myStatusRef, {
  status: "online",
  lastSeen: Date.now()
});

window.addEventListener("beforeunload", () => {

  update(myStatusRef, {
    status: "offline",
    lastSeen: Date.now()
  });

});

onValue(ref(db, "users/" + otherId), (snap) => {

  if (!snap.exists()) return;

  const user = snap.val();

  if (user.status === "online") {

    userStatus.innerText = "🟢 Online";

  } else {

    if (user.lastSeen) {

      const t = new Date(user.lastSeen);

      userStatus.innerText =
        "Last seen " +
        t.toLocaleDateString() +
        " " +
        t.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

    } else {

      userStatus.innerText = "⚫ Offline";

    }

  }

});

// ======================
// TIME FORMAT
// ======================

function formatTime(time) {

  return new Date(time).toLocaleTimeString([], {

    hour: "2-digit",
    minute: "2-digit"

  });

}
// ======================
// LIVE CHAT
// ======================

onValue(ref(db, "privateChats/" + roomId), (snap) => {

  messages.innerHTML = "";

  if (!snap.exists()) return;

  snap.forEach((item) => {

    const chat = item.val();

    const div = document.createElement("div");

    div.className =
      chat.sender === myId ? "myMsg" : "otherMsg";

    let html = "";

    if (chat.image) {

      html += `
        <img src="${chat.image}"
        style="max-width:220px;
        border-radius:10px;">
      `;

    }

    if (chat.text) {

      html += `<div>${chat.text}</div>`;

    }

    html += `
      <small>
        ${formatTime(chat.time)}
      </small>
    `;

    if (chat.sender === myId) {

      html += `
        <small>
          ${chat.seen ? "✓✓ Seen" : "✓ Sent"}
        </small>
      `;

      if (!chat.seen) {

        update(ref(db,
          "privateChats/" + roomId + "/" + item.key), {
          seen: true
        });

      }

    }

    div.innerHTML = html;

    messages.appendChild(div);

  });

  messages.scrollTop = messages.scrollHeight;

});
// ======================
// SEND MESSAGE
// ======================

function sendMessage() {

  const text = msg.value.trim();

  if (text === "") return;

  push(ref(db, "privateChats/" + roomId), {

    sender: myId,
    senderName: myName,
    text: text,
    time: Date.now(),
    seen: false

  });

  // My Recent Chat
  set(ref(db, "recentChats/" + myId + "/" + otherId), {

    name: otherName,
    photo: otherPhoto,
    lastMessage: text,
    time: Date.now(),
    unread: 0

  });

  // Other Recent Chat
  get(ref(db, "recentChats/" + otherId + "/" + myId))
    .then((snap) => {

      const unread = snap.exists()
        ? (snap.val().unread || 0) + 1
        : 1;

      set(ref(db, "recentChats/" + otherId + "/" + myId), {

        name: myName,
        photo: myPhoto,
        lastMessage: text,
        time: Date.now(),
        unread: unread

      });

    });

  msg.value = "";

  remove(ref(db, "typing/" + roomId + "/" + myId));

}

send.onclick = sendMessage;

// Enter Key
msg.addEventListener("keydown", (e) => {

  if (e.key === "Enter") {

    e.preventDefault();

    sendMessage();

  }

});
// ======================
// TYPING STATUS
// ======================

msg.addEventListener("input", () => {

  if (msg.value.trim() === "") {

    remove(ref(db, "typing/" + roomId + "/" + myId));

  } else {

    set(ref(db, "typing/" + roomId + "/" + myId), {
      name: myName
    });

  }

});

onValue(ref(db, "typing/" + roomId), (snap) => {

  if (!snap.exists()) {

    typing.innerText = "";
    return;

  }

  const users = snap.val();

  if (users[otherId]) {

    typing.innerText = "✍️ Typing...";

  } else {

    typing.innerText = "";

  }

});

// ======================
// IMAGE UPLOAD
// ======================

imageBtn.onclick = () => image.click();

image.addEventListener("change", async () => {

  const file = image.files[0];

  if (!file) return;

  const form = new FormData();

  form.append("file", file);

  // अपना Cloudinary Upload Preset डालें
  form.append("upload_preset", "chat_images");

  const res = await fetch(
"https://api.cloudinary.com/v1_1/evsxhohk/image/upload",
    {
      method: "POST",
      body: form
    }
  );

  const data = await res.json();

  push(ref(db, "privateChats/" + roomId), {

    sender: myId,
    senderName: myName,
    image: data.secure_url,
    time: Date.now(),
    seen: false

  });

  // Recent Chats Update
  set(ref(db, "recentChats/" + myId + "/" + otherId), {

    name: otherName,
    photo: otherPhoto,
    lastMessage: "📷 Photo",
    time: Date.now(),
    unread: 0

  });

  set(ref(db, "recentChats/" + otherId + "/" + myId), {

    name: myName,
    photo: myPhoto,
    lastMessage: "📷 Photo",
    time: Date.now(),
    unread: 1

  });

});
// ======================
// AUDIO / VIDEO CALL
// ======================

async function startCall(type) {

  const callId = Date.now().toString();

  localStorage.setItem("callId", callId);
  localStorage.setItem("callType", type);

  await set(ref(db, "calls/" + otherId), {

    callId: callId,
    callerId: myId,
    callerName: myName,
    callerPhoto: myPhoto,
    receiverId: otherId,
    type: type,
    status: "ringing"

  });

  window.location.href = "call.html";

}

// Buttons
audioCallBtn.onclick = () => {

  startCall("audio");

};

videoCallBtn.onclick = () => {

  startCall("video");

};

// ======================
// INCOMING CALL
// ======================

const incomingCall = document.getElementById("incomingCall");
const callerName = document.getElementById("callerName");
const acceptCall = document.getElementById("acceptCall");
const rejectCall = document.getElementById("rejectCall");
const ringtone = document.getElementById("ringtone");

onValue(ref(db, "calls/" + myId), (snap) => {

  if (!snap.exists()) return;

  const call = snap.val();

  if (call.status !== "ringing") return;

  callerName.innerText =
    `${call.callerName} is ${call.type} calling...`;

  incomingCall.style.display = "block";

  ringtone.play().catch(() => {});

  acceptCall.onclick = () => {

    ringtone.pause();
    ringtone.currentTime = 0;

    update(ref(db, "calls/" + myId), {
      status: "accepted"
    });

    localStorage.setItem("callId", call.callId);
    localStorage.setItem("callType", call.type);
    localStorage.setItem("callerId", call.callerId);

    window.location.href = "call.html";

  };

  rejectCall.onclick = () => {

    ringtone.pause();
    ringtone.currentTime = 0;

    update(ref(db, "calls/" + myId), {
      status: "rejected"
    });

    incomingCall.style.display = "none";

  };

});
// ======================
// RESET UNREAD COUNT
// ======================

update(ref(db, "recentChats/" + myId + "/" + otherId), {
  unread: 0
});

// ======================
// CALL CLEANUP
// ======================

window.addEventListener("beforeunload", async () => {

  try {

    await remove(ref(db, "calls/" + myId));

  } catch (e) {

    console.log(e);

  }

});

// ======================
// AUTO LOGIN CHECK
// ======================

if (!myId || !myName) {

  window.location.href = "login.html";

}

// ======================
// CHAT HEADER
// ======================

chatTitle.innerText = otherName;

if (otherPhoto) {

  profilePhoto.src = otherPhoto;

}

// ======================
// AUTO SCROLL
// ======================

const observer = new MutationObserver(() => {

  messages.scrollTop = messages.scrollHeight;

});

observer.observe(messages, {
  childList: true
});

// ======================
// END
// ======================

console.log("✅ private-v3.js Loaded Successfully");