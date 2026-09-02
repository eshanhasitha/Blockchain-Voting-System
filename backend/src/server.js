import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import authRoutes from "./routes/auth.js";
import { protect, adminOnly } from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

// Public health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Blockchain Voting System API is running",
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected route (Part 13)
app.get("/api/protected", protect, (req, res) => {
    res.json({
        message: "You accessed a protected route.",
        user: req.user,
    });
});

// Admin-only route (Part 14)
app.get("/api/admin/test", protect, adminOnly, (req, res) => {
    res.json({
        message: "Admin route accessed successfully.",
        user: req.user,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

connectDatabase();

export default app;