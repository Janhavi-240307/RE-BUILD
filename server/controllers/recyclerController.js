const Recycler = require("../models/Recycler");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
};

exports.getNearbyRecyclers = async (req, res, next) => {
    try {
        const {
            latitude,
            longitude,
            material,
            radius = 50
        } = req.query;

        const lat = Number(latitude);
        const lng = Number(longitude);
        const maxRadius = Number(radius);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180 ||
            !Number.isFinite(maxRadius) ||
            maxRadius <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude, longitude and radius are required"
            });
        }

        const filter = {
            isActive: true
        };

        if (material) {
            filter.acceptedMaterials = material.toLowerCase();
        }

        const recyclers = await Recycler.find(filter);

        const nearby = recyclers
            .map(recycler => {
                const [recyclerLng, recyclerLat] =
                    recycler.location.coordinates;

                return {
                    ...recycler.toObject(),
                    distanceKm: Number(
                        calculateDistance(
                            lat,
                            lng,
                            recyclerLat,
                            recyclerLng
                        ).toFixed(2)
                    )
                };
            })
            .filter(item => item.distanceKm <= maxRadius)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        res.status(200).json({
            success: true,
            count: nearby.length,
            recyclers: nearby
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllRecyclers = async (req, res, next) => {
    try {
        const recyclers = await Recycler.find({
            isActive: true
        });

        res.status(200).json({
            success: true,
            count: recyclers.length,
            recyclers
        });

    } catch (error) {
        next(error);
    }
};