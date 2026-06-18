const Message = require("../models/Message");

const socketHandler = (io) => {

  io.on("connection", (socket) => {

    console.log(`User Connected: ${socket.id}`);

    // JOIN ROOM
    socket.on("join-room", (roomId) => {

      socket.join(roomId);

      console.log(
        `${socket.id} joined room ${roomId}`
      );

    });

    // SEND MESSAGE
    socket.on(
  "send-message",
  async ({ roomId, sender, message }) => {

    try {

      console.log({
        roomId,
        sender,
        message,
      });

      if (!sender) {
        console.log("Sender Missing");
        return;
      }

      const newMessage =
        await Message.create({
          roomId,
          sender,
          message,
        });

      io.to(roomId).emit(
        "receive-message",
        newMessage
      );

    } catch (error) {

      console.log(error);

    }

  }
);

    socket.on("disconnect", () => {

      console.log(
        `User Disconnected: ${socket.id}`
      );

    });

  });

};

module.exports = socketHandler;