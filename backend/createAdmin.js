import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import dns from "dns";
import User from "./src/models/user.model.js";

// Fix for Node.js ESERVFAIL / queryTxt issues on Windows with MongoDB Atlas SRV records
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
}

dotenv.config();

async function createAdmin() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("MONGO_URI not configured in .env");
            process.exit(1);
        }

        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        const adminEmail = process.env.ADMIN_EMAIL || "admin@voting.com";
        const existingAdmin = await User.findOne({
            email: adminEmail.toLowerCase(),
        });

        if (existingAdmin) {
            console.log(`Admin account (${adminEmail}) already exists.`);
            process.exit(0);
        }

        const password = await bcrypt.hash("Admin@12345", 10);

        await User.create({
            name: "System Administrator",
            email: adminEmail.toLowerCase(),
            password,
            role: "admin",
            isVerified: true,
        });

        console.log(`Admin created successfully! Email: ${adminEmail} (Role: admin)`);
        process.exit(0);
    } catch (error) {
        console.error("Failed to create admin:", error);
        process.exit(1);
    }
}

createAdmin();
