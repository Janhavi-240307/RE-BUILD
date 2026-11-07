const notFound = (req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || res.statusCode || 500;
    if (statusCode < 400) statusCode = 500;
    if (err.name === "ValidationError") statusCode = 400;
    if (err.name === "CastError") statusCode = 400;
    if (err.code === 11000) statusCode = 409;
    if (err.name === "MulterError") statusCode = 400;
    res.status(statusCode).json({
        success: false,
        message: err.code === 11000 ? "A record with this value already exists" : err.message || "Internal Server Error"
    });
};

module.exports = { notFound, errorHandler };
