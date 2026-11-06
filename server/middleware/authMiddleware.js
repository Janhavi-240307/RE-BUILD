const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            id: decoded.id
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.name === "TokenExpiredError"
                ? "Session expired. Please login again."
                : "Invalid authentication token"
        });
    }
};

module.exports = protect;