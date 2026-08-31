import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "*", // allow frontend requests from any port during development
    credentials: true,
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Blockchain Voting API is running",
    });
});

app.use("/api/auth", authRoutes);

const startServer = async () => {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();