// ======================================
// AASHISH CHAT PRIVATE V6
// PHASE 1
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ======================================
// FIREBASE
// ======================================

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

// ======================================
// USER
// ======================================

const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");

const otherId = localStorage.getItem("chatWith");

const roomId = [myId, otherId].sort().join("_");

// ======================================
// BUTTONS
// ======================================

const audioCallBtn = document.getElementById("audioCallBtn");
const videoCallBtn = document.getElementById("videoCallBtn");

console.log("✅ PRIVATE V6 PHASE 1");
// ======================================
// PRIVATE V6 PHASE 2
// START CALL
// ======================================

async function startCall(type) {

    // Save Local Data
    localStorage.setItem("callType", type);
    localStorage.setItem("isCaller", "true");

    // Create Firebase Call Node
    await set(ref(db, "calls/" + roomId), {

        roomId: roomId,

        callerId: myId,
        callerName: myName,

        receiverId: otherId,

        type: type,

        status: "ringing",

        createdAt: Date.now()

    });

    // Open Call Screen
    location.href = "call.html";

}

// Audio
audioCallBtn.onclick = () => {

    startCall("audio");

};

// Video
videoCallBtn.onclick = () => {

    startCall("video");

};

console.log("✅ PRIVATE V6 PHASE 2");
// ======================================
// PRIVATE V6 PHASE 3
// INCOMING CALL
// ======================================

const callRef = ref(db, "calls/" + roomId);

onValue(callRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    // अगर मैं Caller हूँ तो कुछ नहीं करना
    if (call.callerId === myId) return;

    // अगर मेरे लिए Call आई है
    if (
        call.receiverId === myId &&
        call.status === "ringing"
    ) {

        const accept = confirm(
            "📞 " + (call.callerName || "Unknown") +
            " is calling...\n\nAccept?"
        );

        if (accept) {

            localStorage.setItem("callType", call.type);
            localStorage.setItem("isCaller", "false");

            update(callRef, {
                status: "accepted",
                acceptedAt: Date.now()
            });

            location.href = "call.html";

        } else {

            update(callRef, {
                status: "rejected"
            });

        }

    }

});

console.log("✅ PRIVATE V6 PHASE 3");
// ======================================
// PRIVATE V6 PHASE 4
// CANCEL CALL
// ======================================

window.addEventListener("beforeunload", async () => {

    try {

        const snap = await get(callRef);

        if (!snap.exists()) return;

        const call = snap.val();

        if (
            call.callerId === myId &&
            call.status === "ringing"
        ) {

            await update(callRef, {
                status: "cancelled"
            });

        }

    } catch (e) {

        console.log(e);

    }

});

console.log("✅ PRIVATE V6 PHASE 4");
// ======================================
// PRIVATE V6 PHASE 5
// CALL STATUS
// ======================================

onValue(callRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    if (call.status === "accepted") {

        console.log("Call Accepted");

    }

    if (call.status === "cancelled") {

        alert("📞 Call Cancelled");

    }

    if (call.status === "rejected") {

        alert("❌ User Rejected");

    }

});

console.log("✅ PRIVATE V6 PHASE 5");
// ======================================
// PRIVATE V6 PHASE 6
// MISSED CALL
// ======================================

setTimeout(async () => {

    const snap = await get(callRef);

    if (!snap.exists()) return;

    const call = snap.val();

    if (call.status === "ringing") {

        await update(callRef, {

            status: "missed"

        });

    }

},30000);

console.log("✅ PRIVATE V6 PHASE 6");
// ======================================
// PRIVATE V6 PHASE 7
// CLEANUP
// ======================================

window.addEventListener("unload", () => {

    localStorage.removeItem("callType");

    localStorage.removeItem("isCaller");

});

console.log("✅ PRIVATE V6 COMPLETE");