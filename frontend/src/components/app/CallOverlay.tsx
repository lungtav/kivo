import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { getRealtimeSocket } from "../../lib/realtime";

const ICE_CONFIG: RTCConfiguration = {
  // STUN covers most NATs; add a TURN server here if calls fail across strict networks
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

type ActiveCall = {
  peerId: string;
  peerName: string;
  video: boolean;
  direction: "in" | "out";
  status: "ringing" | "connecting" | "active" | "unavailable";
};

// lets the channel header start a call without prop drilling
export const callBus: { startCall: ((peerId: string, peerName: string, video: boolean) => void) | null } = {
  startCall: null,
};

export function CallOverlay() {
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const peerRef = useRef<string | null>(null);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingIceRef.current = [];
    peerRef.current = null;
    setMuted(false);
    setCameraOff(false);
    setCall(null);
  };

  const hangup = (notify = true) => {
    if (notify && peerRef.current) getRealtimeSocket()?.emit("call:end", { toUserId: peerRef.current });
    cleanup();
  };

  async function getMedia(video: boolean) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  function ensurePeerConnection(): RTCPeerConnection {
    if (pcRef.current) return pcRef.current;
    const socket = getRealtimeSocket();
    if (!socket) throw new Error("not connected");
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach((track) => {
      if (localStreamRef.current) pc.addTrack(track, localStreamRef.current);
    });
    pc.onicecandidate = (event) => {
      if (event.candidate && peerRef.current) socket.emit("call:ice", { toUserId: peerRef.current, candidate: event.candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCall((current) => (current ? { ...current, status: "active" } : current));
      if (pc.connectionState === "failed") hangup(true);
    };
    return pc;
  }

  async function flushIce() {
    const pc = pcRef.current;
    const socket = getRealtimeSocket();
    if (!pc || !socket) return;
    for (const candidate of pendingIceRef.current) {
      try { await pc.addIceCandidate(candidate); } catch { /* stale candidate after renegotiation */ }
    }
    pendingIceRef.current = [];
  }

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;

    const onIncoming = (payload: { fromUserId: string; from?: { display_name?: string; username?: string } | null; video?: boolean }) => {
      setCall((current) => {
        if (current) {
          socket.emit("call:decline", { toUserId: payload.fromUserId });
          return current;
        }
        peerRef.current = payload.fromUserId;
        return {
          peerId: payload.fromUserId,
          peerName: payload.from?.display_name ?? payload.from?.username ?? "Unknown",
          video: !!payload.video,
          direction: "in",
          status: "ringing",
        };
      });
    };

    // callee accepted — caller creates and sends the offer
    const onAccepted = async () => {
      setCall((current) => (current ? { ...current, status: "connecting" } : current));
      try {
        const pc = ensurePeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (peerRef.current) socket.emit("call:offer", { toUserId: peerRef.current, sdp: offer });
      } catch {
        hangup(true);
      }
    };

    const onOffer = async (payload: { sdp: RTCSessionDescriptionInit }) => {
      setCall((current) => (current ? { ...current, status: "connecting" } : current));
      try {
        const pc = ensurePeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (peerRef.current) socket.emit("call:answer", { toUserId: peerRef.current, sdp: answer });
      } catch {
        hangup(true);
      }
    };

    const onAnswer = async (payload: { sdp: RTCSessionDescriptionInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushIce();
      } catch {
        hangup(true);
      }
    };

    const onIce = async (payload: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(payload.candidate); } catch { /* stale candidate */ }
      } else {
        pendingIceRef.current.push(payload.candidate);
      }
    };

    const onDeclined = () => {
      setCall((current) => (current ? { ...current, status: "unavailable" } : current));
      window.setTimeout(cleanup, 1_500);
    };

    const onEnded = () => cleanup();

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:declined", onDeclined);
    socket.on("call:ended", onEnded);

    callBus.startCall = (peerId: string, peerName: string, video: boolean) => {
      setCall((current) => {
        if (current) return current;
        peerRef.current = peerId;
        void (async () => {
          let useVideo = video;
          try {
            await getMedia(useVideo);
          } catch {
            if (!useVideo) {
              setCall({ peerId, peerName, video: false, direction: "out", status: "unavailable" });
              window.setTimeout(cleanup, 2_500);
              return;
            }
            // no camera — degrade to a voice call instead of failing
            try {
              useVideo = false;
              await getMedia(false);
              setCall({ peerId, peerName, video: false, direction: "out", status: "ringing" });
            } catch {
              setCall({ peerId, peerName, video: false, direction: "out", status: "unavailable" });
              window.setTimeout(cleanup, 2_500);
              return;
            }
          }
          getRealtimeSocket()?.emit("call:ring", { toUserId: peerId, video: useVideo });
        })();
        return { peerId, peerName, video, direction: "out", status: "ringing" };
      });
    };

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:declined", onDeclined);
      socket.off("call:ended", onEnded);
      callBus.startCall = null;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptCall = async () => {
    setCall((current) => (current ? { ...current, status: "connecting" } : current));
    getRealtimeSocket()?.emit("call:accept", { toUserId: peerRef.current });
    try {
      await getMedia(call?.video ?? true);
    } catch {
      hangup(true);
    }
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = muted;
    setMuted(!muted);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = cameraOff;
    setCameraOff(!cameraOff);
  };

  if (!call) return null;

  const statusText =
    call.status === "ringing" ? (call.direction === "in" ? "Incoming call…" : "Ringing…")
    : call.status === "connecting" ? "Connecting…"
    : call.status === "unavailable" ? (call.direction === "in" ? "Missed call" : "Camera or microphone unavailable")
    : "";

  return (
    <div className="fixed inset-0 z-[70] bg-black text-white">
      <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 size-full object-cover" />
      {call.video && <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-24 right-6 h-44 w-60 rounded-2xl border border-white/20 object-cover shadow-2xl" />}

      <div className="absolute left-6 top-6">
        <p className="text-lg font-semibold">{call.peerName}</p>
        {statusText && <p className="mt-0.5 text-sm text-white/60">{statusText}</p>}
      </div>

      {call.direction === "in" && call.status === "ringing" ? (
        <div className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#12121a] p-8 text-center">
            <p className="text-xs uppercase tracking-[.18em] text-white/40">Incoming {call.video ? "video" : "voice"} call</p>
            <p className="mt-3 truncate text-2xl font-bold">{call.peerName}</p>
            <div className="mt-8 flex justify-center gap-6">
              <button onClick={() => hangup(true)} className="grid size-14 place-items-center rounded-full bg-red-600 transition hover:bg-red-500" aria-label="Decline call"><PhoneOff size={20} /></button>
              <button onClick={() => void acceptCall()} className="grid size-14 place-items-center rounded-full bg-emerald-600 transition hover:bg-emerald-500" aria-label="Accept call"><Phone size={20} /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-white/[.06] px-5 py-3 backdrop-blur">
          <button onClick={toggleMute} className={`grid size-11 place-items-center rounded-full transition ${muted ? "bg-white text-neutral-950" : "bg-white/10 hover:bg-white/20"}`} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
          {call.video && <button onClick={toggleCamera} className={`grid size-11 place-items-center rounded-full transition ${cameraOff ? "bg-white text-neutral-950" : "bg-white/10 hover:bg-white/20"}`} aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}>{cameraOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}</button>}
          <button onClick={() => hangup(true)} className="grid size-12 place-items-center rounded-full bg-red-600 transition hover:bg-red-500" aria-label="End call"><PhoneOff size={19} /></button>
        </div>
      )}
    </div>
  );
}
