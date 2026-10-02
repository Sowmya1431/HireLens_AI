const jwt = require('jsonwebtoken');

const authmiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: "Unauthorized. Please log in.",
            message: "Unauthorized. Please log in."
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired session. Please log in again.",
            message: "Invalid or expired session. Please log in again."
        });
    }
};

module.exports = authmiddleware;