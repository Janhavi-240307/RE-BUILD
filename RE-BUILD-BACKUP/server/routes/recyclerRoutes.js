const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getNearbyRecyclers, getAllRecyclers } = require("../controllers/recyclerController");
const router = express.Router();
router.use(protect);
router.get("/nearby", getNearbyRecyclers);
router.get("/", getAllRecyclers);
module.exports = router;
