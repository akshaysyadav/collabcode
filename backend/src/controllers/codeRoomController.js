const CodeRoom =
  require("../models/CodeRoom");

exports.saveCode =
  async (req, res) => {

    try {

      const {
        roomId,
        code,
        language,
      } = req.body;

      const room =
        await CodeRoom.findOneAndUpdate(
          { roomId },

          {
            code,
            language,
          },

          {
            upsert: true,
            new: true,
          }
        );

      res.json(room);

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }

  };

exports.getCode =
  async (req, res) => {

    try {

      const room =
        await CodeRoom.findOne({
          roomId:
            req.params.roomId,
        });

      res.json(
        room || {
          code: "",
          language:
            "javascript",
        }
      );

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }

  };