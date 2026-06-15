const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createRoom,
  joinRoom ,
    getRoom
} = require("../controllers/roomController");

router.post(
  "/create",
  protect,
  createRoom
);

router.post(
  "/join",
  protect,
  joinRoom
);

router.get(
  "/:roomId",
  protect,
  getRoom
);

module.exports = router;