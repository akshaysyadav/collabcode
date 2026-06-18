const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {

    const messages = await Message.find({
      roomId: req.params.roomId,
    })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};