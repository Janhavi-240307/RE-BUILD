const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const buildingRoutes = require("./routes/buildingRoutes");
const recyclerRoutes = require("./routes/recyclerRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_ORIGIN
        ? process.env.CLIENT_ORIGIN.split(",").map(item => item.trim())
        : true,
    credentials: true
}));

app.use(express.json({ limit: "2mb" }));

app.use(express.urlencoded({
    extended: true
}));

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "RE:BUILD Backend is running!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/recyclers", recyclerRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;