const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

const protect = require("../middleware/authMiddleware");

router.get(
  "/profile",
  protect,
  getProfile
);

module.exports = router;