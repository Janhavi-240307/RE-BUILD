const Recycler = require("../models/Recycler");

const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findRecyclerMatches = async (
    materials,
    city = "",
    state = ""
) => {

    const normalized = [
        ...new Set(
            materials.map(item =>
                String(item.material).toLowerCase()
            )
        )
    ];

    if (!normalized.length) return [];

    const locationQuery = [];

    if (city) {
        locationQuery.push({
            city: new RegExp(
                `^${escapeRegex(city)}$`,
                "i"
            )
        });
    }

    if (state) {
        locationQuery.push({
            state: new RegExp(
                `^${escapeRegex(state)}$`,
                "i"
            )
        });
    }

    const query = {
        materialsAccepted: {
            $in: normalized
        }
    };

    let matches = await Recycler.find({
        ...query,
        ...(locationQuery.length
            ? { $or: locationQuery }
            : {})
    }).limit(20);

    // If no local match, search all available recyclers
    if (!matches.length) {
        matches = await Recycler.find(query).limit(20);
    }

    return matches;
};

module.exports = { findRecyclerMatches };