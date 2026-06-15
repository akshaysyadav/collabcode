import { useEffect } from "react";
import socket from "./socket";

function App() {

  useEffect(() => {

    socket.emit(
      "join-room",
      "8A393098"
    );

    socket.on(
      "receive-message",
      (data) => {
        console.log(data);
      }
    );

  }, []);

  const sendMessage = () => {

  console.log("Sending Message");

  socket.emit(
    "send-message",
    {
      roomId: "8A393098",
      sender:
        "6a2f28dcfd4c0c7974f2275a",
      message:
        "Hello from CollabCode",
    }
  );

};
  return (
    <div>
      <h1>CollabCode</h1>

      <button
        onClick={sendMessage}
      >
        Send Message
      </button>
    </div>
  );
}

export default App;