import mongoose from "mongoose";
import dns from "dns";

// Fix for Node.js ESERVFAIL / queryTxt issues on Windows with MongoDB Atlas SRV records
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
}

const connectDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("MONGO_URI is not defined in environment variables");
            return;
        }

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
};

export default connectDatabase;