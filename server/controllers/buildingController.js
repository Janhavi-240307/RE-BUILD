const fs = require("fs");
const path = require("path");
const Building = require("../models/Building");
const Recycler = require("../models/Recycler");
const { analyzeImages } = require("../services/mlService");
const { calculatePassport } = require("../services/passportEngine");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const radians = value => value * Math.PI / 180;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeDetections = items => items.map(item => ({
    material: String(item.material || "").trim().toLowerCase(),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
    areaPct: Math.max(0, Math.min(100, Number(item.areaPct ?? item.area_pct) || 0)),
    box: item.box || null
})).filter(item => item.material);

exports.createBuildingAnalysis = async (req, res, next) => {
    let building;
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "Upload at least one building image" });
        }
        const { name, buildingName, totalAreaSqm, approximateAreaSqM, address, city, state, latitude, longitude, buildingType } = req.body;
        const area = Number(approximateAreaSqM ?? totalAreaSqm);
        const buildingLabel = String(name || buildingName || "").trim();
        if (!buildingLabel || !Number.isFinite(area) || area <= 0) {
            return res.status(400).json({ success: false, message: "Building name and a valid positive area are required" });
        }
        const lat = latitude === undefined || latitude === "" ? null : Number(latitude);
        const lng = longitude === undefined || longitude === "" ? null : Number(longitude);
        if ((lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) || (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))) {
            return res.status(400).json({ success: false, message: "Invalid latitude or longitude" });
        }

        building = await Building.create({
            user: req.user.id,
            name: buildingLabel,
            approximateAreaSqM: area,
            buildingType: buildingType || "Other",
            location: { address: address || "", city: city || "", state: state || "", latitude: lat, longitude: lng },
            imagePaths: req.files.map(file => `/uploads/${file.filename}`),
            analysisStatus: "processing"
        });

        const detections = normalizeDetections(await analyzeImages(req.files));
        const passport = calculatePassport(detections, area);
        let materials = passport.materials;

        if (lat !== null && lng !== null) {
            const recyclers = await Recycler.find({ isActive: true });
            materials = materials.map(material => {
                const match = recyclers
                    .filter(recycler => recycler.acceptedMaterials.includes(material.material))
                    .map(recycler => {
                        const [recyclerLng, recyclerLat] = recycler.location.coordinates;
                        return { recycler, distance: calculateDistance(lat, lng, recyclerLat, recyclerLng) };
                    })
                    .sort((a, b) => a.distance - b.distance)[0];
                return { ...material, matchedRecycler: match ? match.recycler._id : null };
            });
        }

        building.detections = detections;
        building.materials = materials;
        building.totalEstimatedQuantityTonnes = passport.totalEstimatedQuantityTonnes;
        building.totalCO2SavedKg = passport.totalCO2SavedKg;
        building.circularityScore = passport.circularityScore;
        building.recoveryRatePct = passport.recoveryRatePct;
        building.analysisStatus = "completed";
        await building.save();

        const result = await Building.findOne({ _id: building._id, user: req.user.id }).populate("materials.matchedRecycler");
        return res.status(201).json({ success: true, message: "Building analysis completed", building: result });
    } catch (error) {
        if (building) {
            building.analysisStatus = "failed";
            building.analysisError = error.message;
            await building.save().catch(() => {});
        }
        return next(error);
    }
};

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
        for (const image of building.imagePaths || []) {
            const filename = path.basename(image);
            fs.unlink(path.join(__dirname, "../uploads", filename), () => {});
        }
        res.status(200).json({ success: true, message: "Building deleted successfully" });
    } catch (error) { next(error); }
};
