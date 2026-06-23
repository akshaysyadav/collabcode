const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", checkState);
  });
}

export function createConnection(localStream, onRemoteStream) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    if (remoteStream) {
      onRemoteStream(remoteStream);
    }
  };

  return pc;
}

export async function makeOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGatheringComplete(pc);
  return pc.localDescription;
}

export async function makeAnswer(pc, offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGatheringComplete(pc);
  return pc.localDescription;
}

export async function applyAnswer(pc, answer) {
  if (pc.signalingState === "closed") return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}
