const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const messageRoutes = require("./routes/messageRoutes");
const codeRoutes = require("./routes/codeRoutes");
const codeRoomRoutes =require("./routes/codeRoomRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/coderoom",codeRoomRoutes);

app.get("/", (req, res) => {
  res.send("CollabCode Backend Running");
});

module.exports = app;