require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Recycler = require("../models/Recycler");

const recyclers = [
    {
        name: "Green Concrete Recovery",
        address: "Pune, Maharashtra",
        city: "Pune",
        phone: "0000000000",
        acceptedMaterials: ["concrete", "brick"],
        location: {
            type: "Point",
            coordinates: [73.8567, 18.5204]
        }
    },
    {
        name: "Steel Recycling Centre",
        address: "Pimpri-Chinchwad, Maharashtra",
        city: "Pune",
        phone: "0000000000",
        acceptedMaterials: ["steel"],
        location: {
            type: "Point",
            coordinates: [73.8050, 18.6298]
        }
    },
    {
        name: "Wood and Glass Recovery",
        address: "Hadapsar, Pune",
        city: "Pune",
        phone: "0000000000",
        acceptedMaterials: ["wood", "glass", "tiles"],
        location: {
            type: "Point",
            coordinates: [73.9260, 18.5089]
        }
    }
];

const seedData = async () => {
    try {
        await connectDB();

        await Recycler.deleteMany({});

        await Recycler.insertMany(recyclers);

        console.log("Recycler seed data inserted successfully");
    } catch (error) {
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
};

seedData();