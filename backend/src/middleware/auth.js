import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

export async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Invalid token.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "default_jwt_secret_voting_system"
        );

        // If MongoDB is connected, fetch the latest user record (excluding password)
        if (mongoose.connection.readyState === 1) {
            try {
                const user = await User.findById(decoded.id).select("-password");
                if (user) {
                    req.user = user;
                    return next();
                }
            } catch (dbErr) {
                console.warn("DB user lookup error, falling back to token payload:", dbErr.message);
            }
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token.",
        });
    }
}

export function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required.",
        });
    }
    next();
}

export const authenticate = protect;

export default {
    protect,
    authenticate,
    adminOnly,
};