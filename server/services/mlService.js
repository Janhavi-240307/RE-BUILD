const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const analyzeImages = async (files, materialConditions = {}) => {
    const baseUrl = (process.env.ML_SERVICE_URL || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("ML_SERVICE_URL is missing in the backend .env file.");

    const imageResults = [];
    for (const file of files) {
        const form = new FormData();
        form.append("file", fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype
        });
        form.append("material_conditions", JSON.stringify(materialConditions));

        try {
            const response = await axios.post(`${baseUrl}/detect`, form, {
                headers: form.getHeaders(),
                timeout: Number(process.env.ML_SERVICE_TIMEOUT_MS) || 120000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            const data = response.data;
            if (!data || data.success !== true || !Array.isArray(data.detections) || !data.material_analysis) {
                throw new Error("ML /detect returned an unexpected response. Expected success, detections and material_analysis.");
            }
            imageResults.push({ filename: file.originalname, ...data });
        } catch (error) {
            if (error.response) {
                const detail = error.response.data?.detail || error.response.data?.message;
                throw new Error(detail || `ML service returned HTTP ${error.response.status}`);
            }
            if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
                throw new Error("Cannot reach the ML service. Check ML_SERVICE_URL and confirm FastAPI is running.");
            }
            throw error;
        }
    }

    const detections = imageResults.flatMap(result => result.detections.map(item => ({ ...item, sourceImage: result.filename })));
    const materialSummary = {};
    for (const result of imageResults) {
        const summary = result.material_analysis?.material_summary || {};
        for (const [material, values] of Object.entries(summary)) {
            if (!materialSummary[material]) materialSummary[material] = { ...values, count: 0, confidenceWeightedSum: 0, visible_area_pct_sum: 0 };
            const target = materialSummary[material];
            const count = Number(values.count) || 0;
            target.count += count;
            target.confidenceWeightedSum += (Number(values.average_confidence) || 0) * count;
            target.visible_area_pct_sum += Number(values.visible_area_pct_sum) || 0;
            target.condition = values.condition;
            target.contamination = values.contamination;
            target.recovery = values.recovery;
            target.assessment_type = values.assessment_type;
            target.requires_expert_inspection = values.requires_expert_inspection;
        }
    }
    for (const value of Object.values(materialSummary)) {
        value.average_confidence = value.count ? Number((value.confidenceWeightedSum / value.count).toFixed(3)) : 0;
        delete value.confidenceWeightedSum;
    }

    return {
        detections,
        materialAnalysis: {
            total_detections: detections.length,
            materials_detected: Object.keys(materialSummary).length,
            material_summary: materialSummary
        },
        imageResults
    };
};

module.exports = { analyzeImages };
