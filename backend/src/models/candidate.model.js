import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
    {
        electionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true
        },

        blockchainCandidateId: {
            type: Number,
            default: null
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        party: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Candidate",
    candidateSchema
);