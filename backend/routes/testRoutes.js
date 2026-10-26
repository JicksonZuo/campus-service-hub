const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You accessed a protected route successfully",
    user: req.user,
  });
});

module.exports = router;