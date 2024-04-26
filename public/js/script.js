const videoChatForm = document.getElementById("video-chat-form");
const videoChatRooms = document.getElementById("video-chat-rooms");
const roomInput = document.getElementById("roomName");
const joinBtn = document.getElementById("join");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const btnGroup = document.getElementById("btn_grp");
const muteButton = document.getElementById("muteButton");
var mutebuttonflag = false;
const cameraButton = document.getElementById("cameraButton");
var cameraFlag = false;
const leaveButton = document.getElementById("leaveRoom");

var socket = io();
const roomName = roomInput.value;
var creator = false;
var rtcPeerConnection;
var userstram;

var iceServers = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
};
navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

joinBtn.addEventListener("click", () => {
  if (roomInput.value == "") {
    alert("pease enter room name");
  } else {
    socket.emit("join", roomName);
  }
});

muteButton.addEventListener("click", () => {
  mutebuttonflag = !mutebuttonflag;
  if (mutebuttonflag) {
    userstram.getTracks()[0].enabled = false;
    muteButton.textContent = "Unmute";
  } else {
    userstram.getTracks()[0].enabled = true;
    muteButton.textContent = "Mute";
  }
});

cameraButton.addEventListener("click", () => {
  cameraFlag = !cameraFlag;
  if (cameraFlag) {
    userstram.getTracks()[1].enabled = false;
    cameraButton.textContent = "Show Camera";
  } else {
    userstram.getTracks()[1].enabled = true;
    cameraButton.textContent = "Hide Camera";
  }
});

socket.on("created", () => {
  creator = true;
  navigator.getUserMedia(
    { audio: true, video: { width: 500, height: 500 } },
    (stream) => {
      userstram = stream;
      videoChatForm.style = "display:none";
      btnGroup.style = "display:flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };
    },
    (e) => {
      alert("You can't access media");
    }
  );
});
socket.on("joined", () => {
  creator = false;

  navigator.getUserMedia(
    { audio: true, video: { width: 500, height: 500 } },
    (stream) => {
      userstram = stream;
      videoChatForm.style = "display:none";
      btnGroup.style = "display:flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };

      socket.emit("ready", roomName);
    },
    (e) => {
      alert("You can't access media");
    }
  );
});
socket.on("full", () => {
  alert("The Room Is Full You can't Join this room.");
});

socket.on("ready", () => {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidate;
    rtcPeerConnection.ontrack = OnTrackFunction;
    console.log(userstram.getTracks());
    rtcPeerConnection.addTrack(userstram.getTracks()[0], userstram); // audio
    rtcPeerConnection.addTrack(userstram.getTracks()[1], userstram); // video
    rtcPeerConnection.createOffer(
      (offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      },

      (error) => {
        console.log(error);
      }
    );
  }
});

socket.on("candidate", (candidate) => {
  var iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", (offer) => {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidate;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userstram.getTracks()[0], userstram); // audio
    rtcPeerConnection.addTrack(userstram.getTracks()[1], userstram); // video
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.createAnswer(
      (answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      },

      (error) => {
        console.log(error);
      }
    );
  }
});
socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

leaveButton.addEventListener("click", () => {
  socket.emit("leave", roomName);
  videoChatForm.style = "display:block";
  btnGroup.style = "display:none";

  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }

  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});

socket.on("leave", () => {
  creator = true;
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});

function OnIceCandidate(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

function OnTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = (e) => {
    peerVideo.play();
  };
}
