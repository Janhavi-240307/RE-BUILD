const express = require("express");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createBuilding, createBuildingAnalysis, analyzeExistingBuilding, getMyBuildings, getBuildingById, deleteBuilding } = require("../controllers/buildingController");
const { downloadPassport } = require("../utils/generatePassportPdf");
const router = express.Router();
router.use(protect);
router.post("/", createBuilding);
router.post("/analyze", upload.array("images", 5), createBuildingAnalysis); // Backward-compatible combined flow
router.post("/:id/analyze", upload.array("images", 5), analyzeExistingBuilding);
router.get("/", getMyBuildings);
router.get("/:id/passport.pdf", downloadPassport);
router.get("/:id", getBuildingById);
router.delete("/:id", deleteBuilding);
module.exports = router;
