import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import socket from "../socket";
import { getMessages } from "../services/messageService";

function InterviewRoom() {

  const { roomId } = useParams();

  const user = JSON.parse(
    localStorage.getItem("user")
  );
console.log("USER:", user);
  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  useEffect(() => {

    loadMessages();

console.log({
  roomId,
  sender: user?._id,
  message: input,
});

    socket.emit(
      "join-room",
      roomId
    );

    socket.on(
      "receive-message",
      (message) => {

        setMessages((prev) => [
          ...prev,
          message,
        ]);

      }
    );

    return () => {
      socket.off(
        "receive-message"
      );
    };

  }, []);

  const loadMessages = async () => {

    try {

      const data =
        await getMessages(
          roomId
        );

      setMessages(data);

    } catch (error) {

      console.log(error);

    }
  };

 const sendMessage = () => {

  console.log({
    roomId,
    sender: user._id,
    message: input,
  });

  socket.emit(
    "send-message",
    {
      roomId,
      sender: user._id,
      message: input,
    }
  );

  setInput("");
};

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Header */}

      <div className="border-b border-slate-800">

        <div className="max-w-6xl mx-auto p-5">

          <h1 className="text-white text-2xl font-bold">
            CollabCode
          </h1>

          <p className="text-slate-400">
            Room ID:
            {" "}
            {roomId}
          </p>

        </div>

      </div>

      {/* Chat Section */}

      <div className="max-w-4xl mx-auto p-6">

        <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[500px] flex flex-col">

          {/* Messages */}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {messages.map(
              (msg) => (

                <div
                  key={msg._id}
                  className="bg-slate-800 p-3 rounded-lg"
                >

                  <p className="text-blue-400 text-sm">
                    {
                      msg.sender
                        ?.name ||
                      "User"
                    }
                  </p>

                  <p className="text-white">
                    {msg.message}
                  </p>

                </div>

              )
            )}

          </div>

          {/* Input */}

          <div className="border-t border-slate-800 p-4 flex gap-3">

            <input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              placeholder="Type message..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
            />

            <button
              onClick={
                sendMessage
              }
              className="bg-blue-600 hover:bg-blue-700 px-6 rounded-lg text-white"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default InterviewRoom;