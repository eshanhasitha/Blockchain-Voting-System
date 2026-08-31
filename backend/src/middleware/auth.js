import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "default_jwt_secret_voting_system"
        );

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

export function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required",
        });
    }
    next();
}

export default {
    authenticate,
    adminOnly,
};