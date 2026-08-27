import mongoose from "mongoose";

const electionSchema = new mongoose.Schema(
    {
        blockchainElectionId: {
            type: Number,
            default: null
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "UPCOMING",
                "ACTIVE",
                "ENDED"
            ],
            default: "DRAFT"
        },

        contractAddress: {
            type: String,
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Election",
    electionSchema
);