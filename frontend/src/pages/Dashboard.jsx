import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomService";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = async () => {
    try {
      const room = await createRoom();

      navigate(
        `/interview/${room.roomId}`
      );

    } catch  {
      alert("Failed to create room");
    }
  };

  const handleJoinRoom = () => {

    if (!roomId.trim()) {
      return;
    }

    navigate(`/interview/${roomId}`);
  };

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Navbar */}

      <div className="border-b border-slate-800">

        <div className="max-w-6xl mx-auto flex justify-between items-center p-5">

          <h1 className="text-white text-2xl font-bold">
            CollabCode
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white"
          >
            Logout
          </button>

        </div>

      </div>

      {/* Content */}

      <div className="max-w-4xl mx-auto p-8">

        <h2 className="text-white text-3xl font-bold mb-2">
          Welcome Back,
          {" "}
          {user?.name}
          👋
        </h2>

        <p className="text-slate-400 mb-10">
          Create or join an interview room
        </p>

        {/* Create Room */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

          <h3 className="text-white text-xl font-semibold">
            Create Interview Room
          </h3>

          <p className="text-slate-400 mt-2 mb-5">
            Start a new coding interview session
          </p>

          <button
            onClick={handleCreateRoom}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium"
          >
            Create Room
          </button>

        </div>

        {/* Join Room */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <h3 className="text-white text-xl font-semibold">
            Join Existing Room
          </h3>

          <p className="text-slate-400 mt-2 mb-5">
            Enter room ID shared by interviewer
          </p>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value)
            }
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500 mb-4"
          />

          <button
            onClick={handleJoinRoom}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium"
          >
            Join Room
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;