import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

import socket from "../socket";
import { getMessages } from "../services/messageService";
import { runCode } from "../services/codeService";
import { getCode, saveCode } from "../services/codeRoomService";

function InterviewRoom() {
  const { roomId } = useParams();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [users, setUsers] =
    useState([]);

  const [code, setCode] =
    useState("");

  const [language, setLanguage] =
    useState("javascript");

  const [output, setOutput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [dataLoaded,
    setDataLoaded] =
    useState(false);

  // INITIAL LOAD
  useEffect(() => {

    const fetchData =
      async () => {

        try {

          const messagesData =
            await getMessages(
              roomId
            );

          setMessages(
            messagesData
          );

          const codeData =
            await getCode(
              roomId
            );

          setCode(
            codeData.code || ""
          );

          setLanguage(
            codeData.language ||
            "javascript"
          );

          setDataLoaded(true);

        } catch (error) {

          console.log(error);

        }

      };

    fetchData();

  }, [roomId]);

  // JOIN ROOM ONLY ONCE
  useEffect(() => {

    socket.emit(
      "join-room",
      {
        roomId,
        user,
      }
    );

  }, [roomId]);

  // SOCKET LISTENERS
  useEffect(() => {

    socket.on(
      "receive-message",
      (message) => {

        setMessages(
          (prev) => [
            ...prev,
            message,
          ]
        );

      }
    );

    socket.on(
      "receive-code",
      (newCode) => {

        setCode(
          (prev) => {

            if (
              prev === newCode
            )
              return prev;

            return newCode;

          }
        );

      }
    );

    socket.on(
      "room-users",
      (usersList) => {

        setUsers(
          usersList
        );

      }
    );

    return () => {

      socket.off(
        "receive-message"
      );

      socket.off(
        "receive-code"
      );

      socket.off(
        "room-users"
      );

    };

  }, []);

  // AUTO SAVE CODE
  useEffect(() => {

    if (!dataLoaded)
      return;

    const timer =
      setTimeout(
        async () => {

          try {

            await saveCode(
              roomId,
              code,
              language
            );

          } catch (error) {

            console.log(error);

          }

        },
        1000
      );

    return () =>
      clearTimeout(timer);

  }, [
    code,
    language,
    roomId,
    dataLoaded,
  ]);

  const sendMessage =
    () => {

      if (
        !input.trim()
      )
        return;

      socket.emit(
        "send-message",
        {
          roomId,
          sender:
            user?._id ||
            user?.id,
          message:
            input,
        }
      );

      setInput("");

    };

  const handleCodeChange =
    (value) => {

      const newCode =
        value || "";

      setCode(
        newCode
      );

      socket.emit(
        "code-change",
        {
          roomId,
          code: newCode,
        }
      );

    };

  const handleRunCode =
    async () => {

      try {

        setLoading(true);

        const result =
          await runCode(
            code,
            language
          );

        setOutput(
          JSON.stringify(
            result,
            null,
            2
          )
        );

      } catch (error) {

        console.log(error);

        setOutput(
          "Execution Failed"
        );

      } finally {

        setLoading(false);

      }

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
            Room ID: {roomId}
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* CODE EDITOR */}
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between">
              <h2 className="text-white font-semibold">
                Code Editor
              </h2>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value
                  )
                }
                className="bg-slate-800 text-white px-3 py-1 rounded"
              >
                <option value="javascript">
                  JavaScript
                </option>

                <option value="java">
                  Java
                </option>

                <option value="cpp">
                  C++
                </option>

                <option value="python">
                  Python
                </option>
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
                onClick={
                  handleRunCode
                }
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
              >
                {loading
                  ? "Running..."
                  : "Run Code"}
              </button>
            </div>

            <div className="bg-slate-950 border-t border-slate-800 p-4">
              <h3 className="text-white mb-2">
                Output
              </h3>

              <pre className="text-green-400 whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>

          {/* CHAT */}
          <div className="p-3 border-b border-slate-800">

  <h3 className="text-slate-300 text-sm mb-2">
    Participants
  </h3>

  {users.map((u) => (

    <div
      key={u.socketId}
      className="text-white text-sm"
    >
      👤 {u.user.name}
    </div>

  ))}

</div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[670px]">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-white font-semibold">
                Chat
              </h2>
              <p className="text-slate-400 text-sm">
    Active Users:
    {" "}
    {users.length}
  </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(
                (msg, index) => (
                  <div
                    key={
                      msg._id ||
                      index
                    }
                    className="bg-slate-800 p-3 rounded-lg"
                  >
                    <p className="text-blue-400 text-sm">
                      {msg.sender
                        ?.name ||
                        "User"}
                    </p>

                    <p className="text-white">
                      {msg.message}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="border-t border-slate-800 p-4 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                placeholder="Type message..."
                className="flex-1 px-3 py-2 bg-slate-800 rounded text-white"
              />

              <button
                onClick={
                  sendMessage
                }
                className="bg-blue-600 px-4 rounded text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewRoom;