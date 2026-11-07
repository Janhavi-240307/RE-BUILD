const MATERIAL_FACTORS = {
    concrete: {
        intensity: 2.4,
        co2: 80
    },
    brick: {
        intensity: 1.8,
        co2: 60
    },
    steel: {
        intensity: 0.15,
        co2: 1200
    },
    wood: {
        intensity: 0.08,
        co2: 500
    },
    glass: {
        intensity: 0.12,
        co2: 300
    },
    tiles: {
        intensity: 0.25,
        co2: 150
    }
};

const getCondition = (confidence) => {
    if (confidence >= 0.85) return "Good";
    if (confidence >= 0.60) return "Moderate";
    return "Poor";
};

const getPathway = (material, condition) => {
    if (condition === "Good") {
        return "Direct Reuse";
    }

    if (condition === "Moderate") {
        if (material === "concrete") return "Crushing and Recycling";
        if (material === "brick") return "Brick Reuse or Recycling";
        if (material === "steel") return "Metal Recycling";
        if (material === "wood") return "Wood Recovery";
        if (material === "glass") return "Glass Recycling";
        if (material === "tiles") return "Tile Recovery";
    }

    if (material === "concrete") return "Aggregate Recovery";
    if (material === "brick") return "Crushing and Recycling";
    if (material === "steel") return "Metal Recycling";
    if (material === "wood") return "Energy Recovery Assessment";
    if (material === "glass") return "Glass Recycling Assessment";
    if (material === "tiles") return "Construction Waste Recovery";

    return "Further Assessment Required";
};

const calculatePassport = (detections, totalAreaSqm) => {
    const materials = detections.map((item) => {
        const material = String(item.material || "").toLowerCase();

        const factors = MATERIAL_FACTORS[material];

        if (!factors) return null;

        const areaPct = Math.max(
            0,
            Math.min(100, Number(item.areaPct) || 0)
        );

        const confidence = Math.max(
            0,
            Math.min(1, Number(item.confidence) || 0)
        );

        const estimatedQtyTonnes = Number(
            item.estimatedQtyTonnes
        ) || (
                totalAreaSqm *
                (areaPct / 100) *
                factors.intensity
            );

        const condition = getCondition(confidence);

        const recoveryFactor = condition === "Good"
            ? 0.9
            : condition === "Moderate"
                ? 0.65
                : 0.3;

        const co2SavedKg =
            estimatedQtyTonnes *
            factors.co2 *
            recoveryFactor;

        return {
            material,
            areaPct,
            confidence,
            estimatedQtyTonnes: Number(
                estimatedQtyTonnes.toFixed(2)
            ),
            condition,
            pathway: getPathway(material, condition),
            co2SavedKg: Number(co2SavedKg.toFixed(2))
        };
    }).filter(Boolean);

    const totalEstimatedQuantityTonnes = materials.reduce(
        (sum, item) => sum + item.estimatedQtyTonnes,
        0
    );

    const totalCO2SavedKg = materials.reduce(
        (sum, item) => sum + item.co2SavedKg,
        0
    );

    const recoverableQuantity = materials.reduce(
        (sum, item) => {
            const factor = item.condition === "Good"
                ? 0.9
                : item.condition === "Moderate"
                    ? 0.65
                    : 0.3;

            return sum + item.estimatedQtyTonnes * factor;
        },
        0
    );

    const recoveryRatePct = totalEstimatedQuantityTonnes > 0
        ? (recoverableQuantity / totalEstimatedQuantityTonnes) * 100
        : 0;

    const circularityScore = Math.min(
        100,
        Math.round(recoveryRatePct)
    );

    return {
        materials,
        totalEstimatedQuantityTonnes: Number(
            totalEstimatedQuantityTonnes.toFixed(2)
        ),
        totalCO2SavedKg: Number(totalCO2SavedKg.toFixed(2)),
        recoveryRatePct: Number(recoveryRatePct.toFixed(2)),
        circularityScore
    };
};

module.exports = {
    calculatePassport
};