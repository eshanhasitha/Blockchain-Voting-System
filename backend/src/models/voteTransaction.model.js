import mongoose from "mongoose";

const voteTransactionSchema = new mongoose.Schema(
    {
        electionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true
        },

        walletAddress: {
            type: String,
            required: true,
            lowercase: true
        },

        candidateId: {
            type: Number,
            required: true
        },

        transactionHash: {
            type: String,
            required: true,
            unique: true
        },

        blockNumber: {
            type: Number,
            default: null
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "FAILED"
            ],
            default: "PENDING"
        },

        confirmedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "VoteTransaction",
    voteTransactionSchema
);