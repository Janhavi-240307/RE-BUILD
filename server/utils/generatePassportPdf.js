const PDFDocument = require("pdfkit");
const Building = require("../models/Building");

exports.downloadPassport = async (req, res, next) => {
    try {
        const building = await Building.findOne({ _id: req.params.id, user: req.user.id }).populate("materials.matchedRecycler");
        if (!building) return res.status(404).json({ success: false, message: "Building not found" });
        if (building.analysisStatus !== "completed") return res.status(400).json({ success: false, message: "Building analysis is not completed" });

        const doc = new PDFDocument({ size: "A4", margin: 45 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="REBUILD-Passport-${building._id}.pdf"`);
        doc.pipe(res);
        doc.fontSize(24).fillColor("#167D67").text("RE:BUILD", { align: "center" });
        doc.moveDown(0.4);
        doc.fontSize(18).fillColor("#222").text("Material Passport", { align: "center" });
        doc.moveDown();
        doc.fontSize(11).fillColor("#222");
        doc.text(`Building: ${building.name}`);
        doc.text(`Area: ${building.approximateAreaSqM} sq. m.`);
        doc.text(`Location: ${[building.location.address, building.location.city, building.location.state].filter(Boolean).join(", ") || "Not provided"}`);
        doc.text(`Building type: ${building.buildingType || "Other"}`);
        doc.moveDown();
        doc.fontSize(14).fillColor("#167D67").text("Building Summary");
        doc.fontSize(10).fillColor("#222");
        doc.text(`Estimated material quantity: ${building.totalEstimatedQuantityTonnes} tonnes`);
        doc.text(`Estimated CO2 savings: ${building.totalCO2SavedKg} kg`);
        doc.text(`Circularity score: ${building.circularityScore}/100`);
        doc.text(`Recovery rate: ${building.recoveryRatePct}%`);
        doc.moveDown();
        doc.fontSize(14).fillColor("#167D67").text("Material Breakdown");
        (building.materials || []).forEach((item, index) => {
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor("#222").text(`${index + 1}. ${item.material}`);
            doc.fontSize(9).fillColor("#444");
            doc.text(`Estimated quantity: ${item.estimatedQtyTonnes} tonnes`);
            doc.text(`Condition: ${item.condition}`);
            doc.text(`Recovery pathway: ${item.pathway}`);
            doc.text(`Estimated CO2 savings: ${item.co2SavedKg} kg`);
            doc.text(`Recycler: ${item.matchedRecycler?.name || "Not matched"}`);
        });
        doc.moveDown();
        doc.fontSize(8).fillColor("#666").text("Disclaimer: AI-generated preliminary estimates. Material quantities and environmental savings require on-site verification and are not a substitute for a professional audit.");
        doc.end();
    } catch (error) { next(error); }
};
