const mongoose = require("mongoose");

const recyclerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        phone: String,
        email: String,
        acceptedMaterials: [{
            type: String,
            enum: [
                "concrete",
                "brick",
                "steel",
                "wood",
                "glass",
                "tiles"
            ]
        }],
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

recyclerSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Recycler", recyclerSchema);