require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        await connectDB();

        app.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("       RE:BUILD BACKEND");
            console.log("--------------------------------");
            console.log(`Server running on port ${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log("--------------------------------");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();