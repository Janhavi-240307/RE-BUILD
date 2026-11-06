const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const analyzeImages = async files => {
    if (!process.env.ML_SERVICE_URL) throw new Error("ML_SERVICE_URL is missing in .env. Start the ML service and configure its URL.");
    const form = new FormData();
    files.forEach(file => form.append("images", fs.createReadStream(file.path), file.originalname));
    try {
        const response = await axios.post(`${process.env.ML_SERVICE_URL.replace(/\/$/, "")}/predict`, form, {
            headers: form.getHeaders(), timeout: 120000, maxBodyLength: Infinity, maxContentLength: Infinity
        });
        if (!response.data || !Array.isArray(response.data.detections)) throw new Error("ML service must return { detections: [] }");
        return response.data.detections;
    } catch (error) {
        if (error.response) throw new Error(error.response.data?.message || `ML service returned status ${error.response.status}`);
        if (error.code === "ECONNREFUSED") throw new Error("ML service is not running. Start the ML service before analyzing images.");
        throw error;
    }
};

module.exports = { analyzeImages };
