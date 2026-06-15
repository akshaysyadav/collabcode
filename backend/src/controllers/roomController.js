const Room = require("../models/Room");
const crypto = require("crypto");

exports.createRoom = async (req, res) => {
  try {

    const roomId = crypto.randomBytes(4)
      .toString("hex")
      .toUpperCase();

    const room = await Room.create({
      roomId,
      createdBy: req.user.userId,
      participants: [req.user.userId],
    });

    res.status(201).json(room);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

exports.joinRoom = async (req, res) => {
  try {

    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    if (
      !room.participants.includes(req.user.userId)
    ) {
      room.participants.push(req.user.userId);

      await room.save();
    }

    res.status(200).json({
      message: "Joined room successfully",
      room
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getRoom = async (req, res) => {
  try {

    const room = await Room.findOne({
      roomId: req.params.roomId
    })
    .populate("createdBy", "name email")
    .populate("participants", "name email");

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    res.status(200).json(room);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};