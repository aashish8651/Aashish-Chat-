// ===============================
// FIREBASE IMPORTS
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ===============================
// FIREBASE CONFIG
// ===============================

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

// ===============================
// LOGIN CHECK
// ===============================

const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");
const myPhoto = localStorage.getItem("myPhoto") || "";

const otherId = localStorage.getItem("chatWith");
const otherName = localStorage.getItem("chatWithName");
const otherPhoto = localStorage.getItem("chatWithPhoto") || "";

if (!myId || !otherId) {
    alert("User Missing");
    window.location.href = "home.html";
}

// ===============================
// ROOM ID
// ===============================

const roomId = [myId, otherId].sort().join("_");

console.log("Room:", roomId);

// ===============================
// HTML ELEMENTS
// ===============================

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

// ===============================
// HEADER
// ===============================

chatTitle.innerText = otherName;

if (otherPhoto) {
    profilePhoto.src = otherPhoto;
}

// ===============================
// ONLINE STATUS
// ===============================

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

        userStatus.innerText = "⚫ Offline";

    }

});

console.log("✅ PRIVATE V4 PART-1 LOADED");
// ===============================
// TIME FORMAT
// ===============================

function formatTime(time) {

    return new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

// ===============================
// LIVE CHAT
// ===============================

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
            style="max-width:220px;border-radius:10px;">
            `;

        }

        if (chat.text) {

            html += `<div>${chat.text}</div>`;

        }

        html += `
        <small>${formatTime(chat.time)}</small>
        `;

        div.innerHTML = html;

        messages.appendChild(div);

    });

    messages.scrollTop = messages.scrollHeight;

});

// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

    const text = msg.value.trim();

    if (text === "") return;

    await push(ref(db, "privateChats/" + roomId), {

        sender: myId,
        senderName: myName,
        text: text,
        time: Date.now(),
        seen: false

    });

    msg.value = "";

}

// ===============================
// SEND BUTTON
// ===============================

send.onclick = () => {

    sendMessage();

};

// ===============================
// ENTER KEY SEND
// ===============================

msg.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});

console.log("✅ PRIVATE V4 PART-2 LOADED");
// ===============================
// SEEN STATUS
// ===============================

async function markMessagesSeen() {

    const snap = await get(ref(db, "privateChats/" + roomId));

    if (!snap.exists()) return;

    snap.forEach(async (item) => {

        const chat = item.val();

        if (chat.sender !== myId && !chat.seen) {

            await update(
                ref(db, "privateChats/" + roomId + "/" + item.key),
                {
                    seen: true
                }
            );

        }

    });

}

markMessagesSeen();

onValue(ref(db, "privateChats/" + roomId), (snap) => {

    if (!snap.exists()) return;

    messages.innerHTML = "";

    snap.forEach((item) => {

        const chat = item.val();

        const div = document.createElement("div");

        div.className =
            chat.sender === myId
                ? "myMsg"
                : "otherMsg";

        let html = "";

        if (chat.image) {

            html += `
            <img src="${chat.image}"
            style="max-width:220px;border-radius:10px;">
            `;

        }

        if (chat.text) {

            html += `<div>${chat.text}</div>`;

        }

        html += `
        <small>${formatTime(chat.time)}</small>
        `;

        if (chat.sender === myId) {

            html += `
            <br>
            <small>
            ${chat.seen ? "✓✓ Seen" : "✓ Sent"}
            </small>
            `;

        }

        div.innerHTML = html;

        messages.appendChild(div);

    });

    messages.scrollTop = messages.scrollHeight;

});

// ===============================
// TYPING STATUS
// ===============================

msg.addEventListener("input", async () => {

    if (msg.value.trim() === "") {

        await remove(
            ref(db, "typing/" + roomId + "/" + myId)
        );

    } else {

        await set(
            ref(db, "typing/" + roomId + "/" + myId),
            {
                name: myName
            }
        );

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

// ===============================
// AUTO SCROLL
// ===============================

const observer = new MutationObserver(() => {

    messages.scrollTop = messages.scrollHeight;

});

observer.observe(messages, {
    childList: true
});

console.log("✅ PRIVATE V4 PART-3A LOADED");
// ===============================
// IMAGE UPLOAD
// ===============================

imageBtn.onclick = () => image.click();

image.addEventListener("change", async () => {

    const file = image.files[0];

    if (!file) return;

    const form = new FormData();

    form.append("file", file);
    form.append("upload_preset", "chat_images");

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/evsxhohk/image/upload",
        {
            method: "POST",
            body: form
        }
    );

    const data = await res.json();

    await push(ref(db, "privateChats/" + roomId), {

        sender: myId,
        senderName: myName,
        image: data.secure_url,
        time: Date.now(),
        seen: false

    });

});

// ===============================
// START CALL
// ===============================

async function startCall(type) {

    const callId = Date.now().toString();

    localStorage.setItem("callId", callId);
    localStorage.setItem("callType", type);
    localStorage.setItem("isCaller", "true");

    await set(ref(db, "calls/" + roomId), {

        callId: callId,
        roomId: roomId,
        callerId: myId,
        callerName: myName,
        callerPhoto: myPhoto,

        receiverId: otherId,

        type: type,
        status: "ringing",
        time: Date.now()

    });

    window.location.href = "call.html";

}

// ===============================
// CALL BUTTONS
// ===============================

audioCallBtn.onclick = () => {

    startCall("audio");

};

videoCallBtn.onclick = () => {

    startCall("video");

};

// ===============================
// INCOMING CALL
// ===============================

const incomingCall = document.getElementById("incomingCall");
const callerName = document.getElementById("callerName");

const acceptCall = document.getElementById("acceptCall");
const rejectCall = document.getElementById("rejectCall");

const ringtone = document.getElementById("ringtone");

onValue(ref(db, "calls/" + roomId), (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    if (call.receiverId !== myId) return;

    if (call.status !== "ringing") return;

    incomingCall.style.display = "flex";

    callerName.innerText =
        `${call.callerName} is ${call.type} calling`;

    ringtone.play().catch(() => {});

    acceptCall.onclick = async () => {

        ringtone.pause();
        ringtone.currentTime = 0;

        localStorage.setItem("callId", call.callId);
        localStorage.setItem("callType", call.type);
        localStorage.setItem("isCaller", "false");

        await update(ref(db, "calls/" + roomId), {

            status: "accepted"

        });

        window.location.href = "call.html";

    };

    rejectCall.onclick = async () => {

        ringtone.pause();
        ringtone.currentTime = 0;

        await update(ref(db, "calls/" + roomId), {

            status: "rejected"

        });

        incomingCall.style.display = "none";

    };

});

console.log("✅ PRIVATE V4 PART-4 LOADED");
// ===============================
// CALL STATUS LISTENER
// ===============================

onValue(ref(db, "calls/" + roomId), (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    if (call.status === "accepted") {

        if (localStorage.getItem("isCaller") === "true") {

            window.location.href = "call.html";

        }

    }

    if (call.status === "rejected") {

        alert("❌ Call Rejected");

        remove(ref(db, "calls/" + roomId));

    }

});

// ===============================
// CALL CLEANUP
// ===============================

window.addEventListener("beforeunload", async () => {

    try {

        await update(ref(db, "users/" + myId), {

            status: "offline",
            lastSeen: Date.now()

        });

        if (localStorage.getItem("isCaller") === "true") {

            await remove(ref(db, "calls/" + roomId));

        }

    } catch (e) {

        console.log(e);

    }

});

// ===============================
// REMOTE CALL ENDED
// ===============================

onValue(ref(db, "calls/" + roomId), (snap) => {

    if (snap.exists()) return;

    if (window.location.pathname.includes("call.html")) {

        alert("📞 Call Ended");

        window.location.href = "private.html";

    }

});

// ===============================
// FINAL
// ===============================

console.log("✅ PRIVATE V4 FULLY LOADED");