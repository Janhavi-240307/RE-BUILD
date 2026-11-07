const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema({
    material: { type: String, required: true, trim: true, lowercase: true },
    sourceImage: { type: String, default: "" },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    areaPct: { type: Number, min: 0, max: 100, default: 0 },
    box: {
        x: { type: Number, default: null },
        y: { type: Number, default: null },
        width: { type: Number, default: null },
        height: { type: Number, default: null }
    }
}, { _id: false });

const materialSchema = new mongoose.Schema({
    material: { type: String, required: true },
    areaPct: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    estimatedQtyTonnes: { type: Number, default: 0 },
    condition: { type: String, default: "Assessment required" },
    contamination: { type: String, default: "Not provided" },
    pathway: { type: String, default: "Further inspection required" },
    recoveryMethod: { type: String, default: "" },
    recoveryReason: { type: String, default: "" },
    assessmentType: { type: String, default: "" },
    requiresExpertInspection: { type: Boolean, default: true },
    co2SavedKg: { type: Number, default: null },
    matchedRecycler: { type: mongoose.Schema.Types.ObjectId, ref: "Recycler", default: null }
}, { _id: false });

const buildingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    location: {
        address: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" },
        state: { type: String, trim: true, default: "" },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
    },
    buildingType: { type: String, trim: true, default: "Other" },
    approximateAreaSqM: { type: Number, min: 0, required: true },
    imagePaths: [{ type: String }],
    detections: [detectionSchema],
    materials: [materialSchema],
    materialAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    mlImageResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
    estimatesAvailable: { type: Boolean, default: false },
    totalEstimatedQuantityTonnes: { type: Number, default: 0 },
    totalCO2SavedKg: { type: Number, default: 0 },
    circularityScore: { type: Number, min: 0, max: 100, default: 0 },
    recoveryRatePct: { type: Number, min: 0, max: 100, default: 0 },
    analysisStatus: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
    analysisError: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Building", buildingSchema);
