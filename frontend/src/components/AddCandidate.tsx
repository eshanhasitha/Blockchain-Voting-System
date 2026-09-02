import { useState } from "react";
import { getVotingContract, formatMetaMaskError } from "../utils/blockchain";

interface AddCandidateProps {
    defaultElectionId?: number;
    onCandidateAdded?: () => void;
}

export default function AddCandidate({
    defaultElectionId,
    onCandidateAdded,
}: AddCandidateProps) {
    const [electionId, setElectionId] = useState(
        defaultElectionId ? defaultElectionId.toString() : ""
    );
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");
            setError("");
            setTxHash("");

            if (!electionId || Number(electionId) <= 0) {
                setError("Please provide a valid Election ID.");
                setLoading(false);
                return;
            }

            if (!name.trim()) {
                setError("Candidate name cannot be empty.");
                setLoading(false);
                return;
            }

            const contract = await getVotingContract(true);

            setMessage("Please confirm transaction in MetaMask...");
            const tx = await contract.addCandidate(
                Number(electionId),
                name.trim(),
                description.trim() || "Candidate for election"
            );

            setTxHash(tx.hash);
            setMessage("Transaction submitted. Waiting for blockchain confirmation...");

            await tx.wait();

            setMessage(`Candidate "${name}" added successfully!`);
            setName("");
            setDescription("");

            onCandidateAdded?.();
        } catch (err: any) {
            console.error("Add candidate error:", err);
            setError(formatMetaMaskError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-lg space-y-4"
        >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Add Candidate
            </h2>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Election ID *
                </label>
                <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={electionId}
                    onChange={(e) => setElectionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Candidate Name *
                </label>
                <input
                    type="text"
                    placeholder="e.g. Alice Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Candidate Description / Manifesto
                </label>
                <textarea
                    rows={2}
                    placeholder="Candidate bio or platform goals"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-emerald-600/25"
            >
                {loading ? "Adding to Blockchain..." : "Add Candidate"}
            </button>

            {message && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs">
                    <p>{message}</p>
                    {txHash && (
                        <p className="mt-1 font-mono text-[11px] text-emerald-400 break-all">
                            Tx: {txHash}
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-lg text-red-300 text-xs">
                    {error}
                </div>
            )}
        </form>
    );
}
