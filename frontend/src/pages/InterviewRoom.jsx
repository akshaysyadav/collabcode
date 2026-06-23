import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

import socket from "../socket";
import { getMessages } from "../services/messageService";
import { runCode } from "../services/codeService";
import { getCode, saveCode } from "../services/codeRoomService";
import {
  createConnection,
  makeOffer,
  makeAnswer,
  applyAnswer,
} from "../utils/webrtc";

function InterviewRoom() {
  const { roomId } = useParams();

  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [mediaReady, setMediaReady] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [callActive, setCallActive] = useState(false);

  const myVideo = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingOffersRef = useRef([]);

  const destroyPeer = useCallback((targetSocketId) => {
    const pc = peersRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(targetSocketId);
    }
    setRemoteStreams((prev) => {
      if (!prev[targetSocketId]) return prev;
      const next = { ...prev };
      delete next[targetSocketId];
      return next;
    });
  }, []);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setRemoteStreams({});
    setCallActive(false);
  }, []);

  const ensureMedia = useCallback(async () => {
    if (streamRef.current) {
      return { ok: true, pending: [] };
    }

    setMediaLoading(true);
    setMediaError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }

      setMediaReady(true);

      const pending = [...pendingOffersRef.current];
      pendingOffersRef.current = [];
      return { ok: true, pending };
    } catch (error) {
      console.error("getUserMedia failed:", error);
      setMediaError(
        error.name === "NotAllowedError"
          ? "Camera/mic permission denied — click Enable Camera and allow access"
          : "Camera not available on this device"
      );
      return { ok: false, pending: [] };
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const createAnswerConnection = useCallback(
    async (offer, fromSocketId) => {
      if (fromSocketId === socket.id) return;

      destroyPeer(fromSocketId);

      const pc = createConnection(streamRef.current, (remoteStream) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [fromSocketId]: remoteStream,
        }));
        setCallActive(true);
      });

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          destroyPeer(fromSocketId);
        }
      };

      peersRef.current.set(fromSocketId, pc);

      try {
        const answer = await makeAnswer(pc, offer);
        socket.emit("video-answer", {
          roomId,
          signal: answer,
          targetSocketId: fromSocketId,
        });
      } catch (error) {
        console.error("Failed to create answer:", error);
        destroyPeer(fromSocketId);
      }
    },
    [roomId, destroyPeer]
  );

  const createOfferConnection = useCallback(
    async (targetSocketId) => {
      destroyPeer(targetSocketId);

      const pc = createConnection(streamRef.current, (remoteStream) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSocketId]: remoteStream,
        }));
        setCallActive(true);
      });

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          destroyPeer(targetSocketId);
        }
      };

      peersRef.current.set(targetSocketId, pc);

      try {
        const offer = await makeOffer(pc);
        socket.emit("video-offer", {
          roomId,
          signal: offer,
          targetSocketId,
        });
      } catch (error) {
        console.error("Failed to create offer:", error);
        destroyPeer(targetSocketId);
      }
    },
    [roomId, destroyPeer]
  );

  const processPendingOffers = useCallback(
    async (pending) => {
      for (const { signal, fromSocketId } of pending) {
        await createAnswerConnection(signal, fromSocketId);
      }
    },
    [createAnswerConnection]
  );

  // INITIAL LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        const messagesData = await getMessages(roomId);
        setMessages(messagesData);

        const codeData = await getCode(roomId);
        setCode(codeData.code || "");
        setLanguage(codeData.language || "javascript");

        setDataLoaded(true);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [roomId]);

  // JOIN ROOM (re-join on reconnect)
  useEffect(() => {
    const joinRoom = () => {
      socket.emit("join-room", { roomId, user });
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [roomId]);

  // CHAT / CODE / USERS SOCKET LISTENERS
  useEffect(() => {
    const onReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onReceiveCode = (newCode) => {
      setCode((prev) => (prev === newCode ? prev : newCode));
    };

    const onRoomUsers = (usersList) => {
      setUsers(usersList);
    };

    socket.on("receive-message", onReceiveMessage);
    socket.on("receive-code", onReceiveCode);
    socket.on("room-users", onRoomUsers);

    return () => {
      socket.off("receive-message", onReceiveMessage);
      socket.off("receive-code", onReceiveCode);
      socket.off("room-users", onRoomUsers);
    };
  }, []);

  // AUTO SAVE CODE
  useEffect(() => {
    if (!dataLoaded) return;

    const timer = setTimeout(async () => {
      try {
        await saveCode(roomId, code, language);
      } catch (error) {
        console.log(error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, language, roomId, dataLoaded]);

  // VIDEO SIGNALING LISTENERS
  useEffect(() => {
    const onVideoOffer = async ({ signal, fromSocketId }) => {
      if (!fromSocketId || fromSocketId === socket.id || !signal) return;

      if (!streamRef.current) {
        pendingOffersRef.current.push({ signal, fromSocketId });
        return;
      }

      await createAnswerConnection(signal, fromSocketId);
    };

    const onVideoAnswer = async ({ signal, fromSocketId }) => {
      if (!fromSocketId || !signal) return;

      const pc = peersRef.current.get(fromSocketId);
      if (!pc || pc.signalingState === "closed") return;

      try {
        await applyAnswer(pc, signal);
      } catch (error) {
        console.error("Failed to apply answer:", error);
        destroyPeer(fromSocketId);
      }
    };

    socket.on("video-offer", onVideoOffer);
    socket.on("video-answer", onVideoAnswer);

    return () => {
      socket.off("video-offer", onVideoOffer);
      socket.off("video-answer", onVideoAnswer);
    };
  }, [createAnswerConnection, destroyPeer]);

  // CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      destroyAllPeers();
      pendingOffersRef.current = [];
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [destroyAllPeers]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("send-message", {
      roomId,
      sender: user?._id || user?.id,
      message: input,
    });

    setInput("");
  };

  const handleCodeChange = (value) => {
    const newCode = value || "";
    setCode(newCode);

    socket.emit("code-change", {
      roomId,
      code: newCode,
    });
  };

  const handleRunCode = async () => {
    try {
      setLoading(true);
      const result = await runCode(code, language);
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(error);
      setOutput("Execution Failed");
    } finally {
      setLoading(false);
    }
  };

  const enableCamera = async () => {
    const result = await ensureMedia();
    if (result.ok && result.pending.length > 0) {
      await processPendingOffers(result.pending);
    }
  };

  const startCall = async () => {
    const result = await ensureMedia();
    if (!result.ok) return;

    if (result.pending.length > 0) {
      await processPendingOffers(result.pending);
    }

    const others = users.filter((u) => u.socketId !== socket.id);

    if (others.length === 0) {
      alert("No one else is in the room yet");
      return;
    }

    for (const { socketId: targetSocketId } of others) {
      await createOfferConnection(targetSocketId);
    }
  };

  const endCall = () => {
    destroyAllPeers();
  };

  const remoteStreamList = Object.entries(remoteStreams);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto p-5">
          <h1 className="text-white text-2xl font-bold">CollabCode</h1>
          <p className="text-slate-400">Room ID: {roomId}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* CODE EDITOR */}
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between">
              <h2 className="text-white font-semibold">Code Editor</h2>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-800 text-white px-3 py-1 rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <Editor
              height="600px"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
            />

            <div className="border-t border-slate-800 p-4">
              <button
                onClick={handleRunCode}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
              >
                {loading ? "Running..." : "Run Code"}
              </button>
            </div>

            <div className="bg-slate-950 border-t border-slate-800 p-4">
              <h3 className="text-white mb-2">Output</h3>
              <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
            </div>
          </div>

          {/* RIGHT COLUMN: Video + Participants + Chat */}
          <div className="flex flex-col gap-6">
            {/* VIDEO CALL */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-white mb-4">Video Call</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 text-xs mb-1">You</p>
                  <video
                    ref={myVideo}
                    autoPlay
                    muted
                    playsInline
                    className="rounded-lg w-full bg-slate-800 aspect-video object-cover"
                  />
                </div>

                {remoteStreamList.length > 0 ? (
                  remoteStreamList.map(([socketId, stream]) => {
                    const remoteUser = users.find(
                      (u) => u.socketId === socketId
                    );
                    return (
                      <div key={socketId}>
                        <p className="text-slate-400 text-xs mb-1">
                          {remoteUser?.user?.name || "Remote"}
                        </p>
                        <video
                          autoPlay
                          playsInline
                          ref={(el) => {
                            if (el) el.srcObject = stream;
                          }}
                          className="rounded-lg w-full bg-slate-800 aspect-video object-cover"
                        />
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Remote</p>
                    <div className="rounded-lg w-full bg-slate-800 aspect-video flex items-center justify-center">
                      <span className="text-slate-500 text-sm">
                        {callActive
                          ? "Connecting..."
                          : "Waiting for peer..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {!mediaReady && (
                  <button
                    onClick={enableCamera}
                    disabled={mediaLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
                  >
                    {mediaLoading ? "Requesting access..." : "Enable Camera"}
                  </button>
                )}

                <button
                  onClick={startCall}
                  disabled={mediaLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded text-white"
                >
                  Start Call
                </button>

                {(callActive || remoteStreamList.length > 0) && (
                  <button
                    onClick={endCall}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                  >
                    End Call
                  </button>
                )}
              </div>

              {mediaError && (
                <p className="text-red-400 text-sm mt-2">{mediaError}</p>
              )}
            </div>

            {/* PARTICIPANTS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-slate-300 text-sm mb-2">Participants</h3>
              {users.map((u) => (
                <div
                  key={`${u.socketId}-${u.user.id || u.user._id}`}
                  className="text-white text-sm"
                >
                  👤 {u.user.name}
                  {u.socketId === socket.id ? " (you)" : ""}
                </div>
              ))}
            </div>

            {/* CHAT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-800">
                <h2 className="text-white font-semibold">Chat</h2>
                <p className="text-slate-400 text-sm">
                  Active Users: {users.length}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className="bg-slate-800 p-3 rounded-lg"
                  >
                    <p className="text-blue-400 text-sm">
                      {msg.sender?.name || "User"}
                    </p>
                    <p className="text-white">{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 p-4 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 bg-slate-800 rounded text-white"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-4 rounded text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewRoom;
