import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

};


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Blockchain Voting API is running"
    });
});

startServer();