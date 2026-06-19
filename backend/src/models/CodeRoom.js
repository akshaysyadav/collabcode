const mongoose =
  require("mongoose");

const codeRoomSchema =
  new mongoose.Schema(
    {
      roomId: {
        type: String,
        required: true,
        unique: true,
      },

      code: {
        type: String,
        default: "",
      },

      language: {
        type: String,
        default: "javascript",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "CodeRoom",
    codeRoomSchema
  );