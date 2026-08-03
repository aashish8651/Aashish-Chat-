// ======================================
// AASHISH CHAT
// CALL V7
// PHASE 1
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const otherId = localStorage.getItem("chatWith");

const roomId = [myId, otherId].sort().join("_");

const callId = localStorage.getItem("callId");
const callType = localStorage.getItem("callType");
const isCaller = localStorage.getItem("isCaller") === "true";

const callRef = ref(db, "calls/" + roomId);

const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");

const endBtn = document.getElementById("endBtn");
const muteBtn = document.getElementById("muteBtn");
const cameraBtn = document.getElementById("cameraBtn");

const callTitle = document.getElementById("callTitle");
const callTime = document.getElementById("callTime");

let peer = null;
let localStream = null;
let remoteStream = new MediaStream();

console.log("✅ CALL V7 PHASE 1");
// ======================================
// CALL V7
// PHASE 2
// MEDIA + PEER
// ======================================

peer = new RTCPeerConnection({

    iceServers: [

        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302"
            ]
        }

    ]

});

remoteVideo.srcObject = remoteStream;

async function startMedia() {

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: callType === "video",

                audio: true

            });

        myVideo.srcObject = localStream;

        localStream.getTracks().forEach(track => {

            peer.addTrack(track, localStream);

        });

    } catch (e) {

        alert("Camera / Mic Permission Denied");

        console.log(e);

    }

}

peer.ontrack = (event) => {

    event.streams[0].getTracks().forEach(track => {

        if (
            !remoteStream.getTracks().find(t => t.id === track.id)
        ) {

            remoteStream.addTrack(track);

        }

    });

};

console.log("✅ CALL V7 PHASE 2");
// ======================================
// CALL V7
// PHASE 3
// OFFER / ANSWER
// ======================================

// Caller
async function createOffer() {

    const offer = await peer.createOffer();

    await peer.setLocalDescription(offer);

    await set(ref(db, "calls/" + roomId + "/offer"), {

        type: offer.type,
        sdp: offer.sdp

    });

}

// Receiver
onValue(ref(db, "calls/" + roomId + "/offer"), async (snap) => {

    if (!snap.exists()) return;

    if (isCaller) return;

    if (peer.remoteDescription) return;

    const offer = snap.val();

    await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
    );

    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    await set(ref(db, "calls/" + roomId + "/answer"), {

        type: answer.type,
        sdp: answer.sdp

    });

});

// Caller
onValue(ref(db, "calls/" + roomId + "/answer"), async (snap) => {

    if (!snap.exists()) return;

    if (!isCaller) return;

    if (peer.remoteDescription) return;

    const answer = snap.val();

    await peer.setRemoteDescription(
        new RTCSessionDescription(answer)
    );

});

// Start Camera + Mic
startMedia().then(() => {

    if (isCaller) {

        createOffer();

    }

});

console.log("✅ CALL V7 PHASE 3");
// ======================================
// CALL V7
// PHASE 4
// ICE CANDIDATES
// ======================================

// Send ICE
peer.onicecandidate = async (event) => {

    if (!event.candidate) return;

    await push(
        ref(db, "calls/" + roomId + "/ice/" + myId),
        event.candidate.toJSON()
    );

};

// Receive ICE
onValue(
    ref(db, "calls/" + roomId + "/ice/" + otherId),
    async (snap) => {

        if (!snap.exists()) return;

        const candidates = snap.val();

        for (const key in candidates) {

            try {

                await peer.addIceCandidate(
                    new RTCIceCandidate(candidates[key])
                );

            } catch (err) {

                console.log(err);

            }

        }

    }
);

console.log("✅ CALL V7 PHASE 4");
// ======================================
// CALL V7
// PHASE 5
// CONNECTION + TIMER
// ======================================

let timer = 0;
let timerInterval = null;

peer.onconnectionstatechange = () => {

    console.log("STATE:", peer.connectionState);

    if (peer.connectionState === "connected") {

        callTitle.innerText = "🟢 Connected";

        if (!timerInterval) {

            timerInterval = setInterval(() => {

                timer++;

                const min = String(Math.floor(timer / 60)).padStart(2, "0");
                const sec = String(timer % 60).padStart(2, "0");

                callTime.innerText = min + ":" + sec;

            }, 1000);

        }

    }

    if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
    ) {

        clearInterval(timerInterval);

        callTitle.innerText = "🔴 Call Ended";

    }

};

// ============================
// MUTE
// ============================

muteBtn.onclick = () => {

    if (!localStream) return;

    const audio = localStream.getAudioTracks()[0];

    if (!audio) return;

    audio.enabled = !audio.enabled;

    muteBtn.innerText = audio.enabled ? "🎤" : "🔇";

};

// ============================
// CAMERA
// ============================

cameraBtn.onclick = () => {

    if (!localStream) return;

    const video = localStream.getVideoTracks()[0];

    if (!video) return;

    video.enabled = !video.enabled;

    cameraBtn.innerText = video.enabled ? "📷" : "🚫";

};

console.log("✅ CALL V7 PHASE 5");
// ======================================
// CALL V7
// PHASE 6
// END CALL + CLEANUP
// ======================================

async function endCall() {

    clearInterval(timerInterval);

    try {

        if (localStream) {

            localStream.getTracks().forEach(track => track.stop());

        }

        if (remoteStream) {

            remoteStream.getTracks().forEach(track => track.stop());

        }

        if (peer) {

            peer.close();

        }

        await update(callRef, {

            status: "ended",
            endedBy: myId,
            endedAt: Date.now()

        });

        setTimeout(async () => {

            await remove(callRef);

        }, 1000);

    } catch (e) {

        console.log(e);

    }

    location.href = "private.html";

}

endBtn.onclick = endCall;

// Remote End
onValue(callRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    if (call.status === "ended") {

        clearInterval(timerInterval);

        if (peer) {

            peer.close();

        }

        alert("📞 Call Ended");

        location.href = "private.html";

    }

});

window.addEventListener("beforeunload", () => {

    try {

        if (localStream) {

            localStream.getTracks().forEach(track => track.stop());

        }

        if (peer) {

            peer.close();

        }

    } catch (e) {

        console.log(e);

    }

});

console.log("✅ CALL V7 COMPLETE");