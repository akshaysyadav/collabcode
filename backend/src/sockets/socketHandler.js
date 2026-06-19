const Message = require("../models/Message");

const roomUsers = {};

const socketHandler = (io) => {

  io.on("connection", (socket) => {

    console.log(`User Connected: ${socket.id}`);

    // JOIN ROOM
    socket.on("join-room", ({ roomId, user }) => {
console.log(
    "JOIN ROOM RECEIVED",
    user.name
  );

  socket.join(roomId);

  socket.roomId = roomId;
  socket.user = user;

if (!roomUsers[roomId]) {
  roomUsers[roomId] = [];
}

const alreadyExists =
  roomUsers[roomId].find(
    (u) =>
      (u.user.id || u.user._id) ===
      (user.id || user._id)
  );

if (!alreadyExists) {

  roomUsers[roomId].push({
    socketId: socket.id,
    user,
  });

}

  io.to(roomId).emit(
    "room-users",
    roomUsers[roomId]
  );

  console.log(
    `${user.name} joined ${roomId}`
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

    // LIVE CODE SYNC

  socket.on("disconnect", () => {

  const roomId = socket.roomId;

  if (
    roomId &&
    roomUsers[roomId]
  ) {

    roomUsers[roomId] =
      roomUsers[roomId].filter(
        (u) =>
          u.socketId !== socket.id
      );

    io.to(roomId).emit(
      "room-users",
      roomUsers[roomId]
    );

  }

  console.log(
    `User Disconnected: ${socket.id}`
  );

});

socket.on(
  "code-change",
  ({ roomId, code }) => {

    console.log(
      "Code Change:",
      roomId
    );

    socket.to(roomId).emit(
      "receive-code",
      code
    );

  }
);


  });

};

module.exports = socketHandler;