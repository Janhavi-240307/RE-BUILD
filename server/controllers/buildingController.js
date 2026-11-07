const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Building = require("../models/Building");
const { analyzeImages } = require("../services/mlService");

const parseCoordinates = (value, min, max, label) => {
    if (value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) throw new Error(`Invalid ${label}`);
    return number;
};

const parseConditions = value => {
    if (!value) return {};
    let parsed;
    try { parsed = typeof value === "string" ? JSON.parse(value) : value; }
    catch { throw new Error("material_conditions must be valid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("material_conditions must be a JSON object.");
    return parsed;
};

const mapBox = box => {
    if (Array.isArray(box) && box.length === 4) return { x: Number(box[0]), y: Number(box[1]), width: Number(box[2]) - Number(box[0]), height: Number(box[3]) - Number(box[1]) };
    if (box && typeof box === "object") return { x: Number(box.x) || 0, y: Number(box.y) || 0, width: Number(box.width) || 0, height: Number(box.height) || 0 };
    return undefined;
};

const normalizeDetections = items => items.map(item => ({
    material: String(item.material || "").trim().toLowerCase(),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
    areaPct: Math.max(0, Math.min(100, Number(item.area_pct ?? item.areaPct) || 0)),
    box: mapBox(item.box),
    sourceImage: item.sourceImage || ""
})).filter(item => item.material);

const buildMaterialRecords = materialAnalysis => Object.entries(materialAnalysis?.material_summary || {}).map(([material, data]) => {
    const recovery = data.recovery || {};
    return {
        material,
        areaPct: Math.min(100, Number(data.visible_area_pct_sum) || 0),
        confidence: Number(data.average_confidence) || 0,
        estimatedQtyTonnes: null,
        condition: data.condition || "Assessment required",
        contamination: data.contamination || "Not provided",
        pathway: recovery.recommendation || "Further inspection required",
        recoveryMethod: recovery.method || "",
        recoveryReason: recovery.reason || "",
        assessmentType: data.assessment_type || "",
        requiresExpertInspection: data.requires_expert_inspection !== false,
        co2SavedKg: null
    };
});

exports.createBuilding = async (req, res, next) => {
    try {
        const { name, buildingName, approximateAreaSqM, totalAreaSqm, address = "", city = "", state = "", buildingType = "Other" } = req.body;
        const label = String(name || buildingName || "").trim();
        const area = Number(approximateAreaSqM ?? totalAreaSqm);
        if (!label || !Number.isFinite(area) || area <= 0) return res.status(400).json({ success: false, message: "Building name and a valid positive area are required." });
        const latitude = parseCoordinates(req.body.latitude, -90, 90, "latitude");
        const longitude = parseCoordinates(req.body.longitude, -180, 180, "longitude");
        const building = await Building.create({
            user: req.user.id, name: label, approximateAreaSqM: area, buildingType,
            location: { address, city, state, latitude, longitude }, analysisStatus: "processing"
        });
        return res.status(201).json({ success: true, message: "Building registered.", building });
    } catch (error) { return next(error); }
};

const runBuildingAnalysis = async (req, res, next, buildingId = null) => {
    let building;
    try {
        if (!req.files?.length) return res.status(400).json({ success: false, message: "Upload at least one building image." });
        if (buildingId && !mongoose.isValidObjectId(buildingId)) return res.status(400).json({ success: false, message: "Invalid building ID." });
        building = buildingId
            ? await Building.findOne({ _id: buildingId, user: req.user.id })
            : null;
        if (buildingId && !building) return res.status(404).json({ success: false, message: "Building not found." });

        if (!building) {
            const { name, buildingName, approximateAreaSqM, totalAreaSqm, address = "", city = "", state = "", buildingType = "Other" } = req.body;
            const label = String(name || buildingName || "").trim();
            const area = Number(approximateAreaSqM ?? totalAreaSqm);
            if (!label || !Number.isFinite(area) || area <= 0) return res.status(400).json({ success: false, message: "Building name and a valid positive area are required." });
            building = await Building.create({ user: req.user.id, name: label, approximateAreaSqM: area, buildingType, location: { address, city, state, latitude: parseCoordinates(req.body.latitude, -90, 90, "latitude"), longitude: parseCoordinates(req.body.longitude, -180, 180, "longitude") }, analysisStatus: "processing" });
        }

        building.analysisStatus = "processing";
        building.analysisError = "";
        building.imagePaths = [...(building.imagePaths || []), ...req.files.map(file => `/uploads/${file.filename}`)];
        await building.save();

        const conditions = parseConditions(req.body.material_conditions);
        const mlResult = await analyzeImages(req.files, conditions);
        const detections = normalizeDetections(mlResult.detections);
        building.detections = detections;
        building.materialAnalysis = mlResult.materialAnalysis;
        building.mlImageResults = mlResult.imageResults;
        building.materials = buildMaterialRecords(mlResult.materialAnalysis);
        // Quantity, recovery-rate and CO2 calculations are intentionally not fabricated.
        building.estimatesAvailable = false;
        building.totalEstimatedQuantityTonnes = 0;
        building.totalCO2SavedKg = 0;
        building.circularityScore = 0;
        building.recoveryRatePct = 0;
        building.analysisStatus = "completed";
        await building.save();
        const result = await Building.findOne({ _id: building._id, user: req.user.id }).populate("materials.matchedRecycler");
        return res.status(200).json({ success: true, message: "ML analysis completed and saved.", building: result });
    } catch (error) {
        if (building) { building.analysisStatus = "failed"; building.analysisError = error.message; await building.save().catch(() => {}); }
        return next(error);
    }
};

exports.createBuildingAnalysis = (req, res, next) => runBuildingAnalysis(req, res, next);
exports.analyzeExistingBuilding = (req, res, next) => runBuildingAnalysis(req, res, next, req.params.id);

exports.getMyBuildings = async (req, res, next) => {
    try {
        const buildings = await Building.find({ user: req.user.id }).sort({ createdAt: -1 }).populate("materials.matchedRecycler");
        res.status(200).json({ success: true, count: buildings.length, buildings });
    } catch (error) { next(error); }
};

exports.getBuildingById = async (req, res, next) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, user: req.user.id }).populate("materials.matchedRecycler");
        if (!building) return res.status(404).json({ success: false, message: "Building not found" });
        res.status(200).json({ success: true, building });
    } catch (error) { next(error); }
};

exports.deleteBuilding = async (req, res, next) => {
    try {
        const building = await Building.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!building) return res.status(404).json({ success: false, message: "Building not found" });
        for (const image of building.imagePaths || []) fs.unlink(path.join(__dirname, "../uploads", path.basename(image)), () => {});
        res.status(200).json({ success: true, message: "Building deleted successfully" });
    } catch (error) { next(error); }
};
