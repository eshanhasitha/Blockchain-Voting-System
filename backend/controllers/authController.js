import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../src/models/user.model.js";

function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            walletAddress: user.walletAddress,
        },
        process.env.JWT_SECRET || "default_jwt_secret_voting_system",
        {
            expiresIn: "1d",
        }
    );
}

export async function register(req, res) {
    try {
        const { name, email, password, walletAddress } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists.",
            });
        }

        if (walletAddress && walletAddress.trim()) {
            const existingWallet = await User.findOne({
                walletAddress: walletAddress.toLowerCase().trim(),
            });
            if (existingWallet) {
                return res.status(400).json({
                    message: "Wallet address is already registered.",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Enforce voter role for public registrations (security requirement)
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            walletAddress: walletAddress?.trim() ? walletAddress.toLowerCase().trim() : "",
            role: "voter",
            isVerified: false,
        });

        const token = generateToken(user);

        return res.status(201).json({
            message: "Registration successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: error.message || "Registration failed.",
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user);

        return res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: error.message || "Login failed.",
        });
    }
}

export default {
    register,
    login,
};
