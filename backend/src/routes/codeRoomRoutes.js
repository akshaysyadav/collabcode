const express =
  require("express");

const router =
  express.Router();

const {
  saveCode,
  getCode,
} = require(
  "../controllers/codeRoomController"
);

router.post(
  "/save",
  saveCode
);

router.get(
  "/:roomId",
  getCode
);

module.exports =
  router;