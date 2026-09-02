import { useState } from "react";
import { getVotingContract, formatMetaMaskError } from "../utils/blockchain";

interface CreateElectionProps {
    onElectionCreated?: () => void;
}

export default function CreateElection({ onElectionCreated }: CreateElectionProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Helper to set quick future timestamps
    const setQuickTime = (startDelayMinutes: number, durationHours: number) => {
        const now = new Date();
        const start = new Date(now.getTime() + startDelayMinutes * 60 * 1000);
        const end = new Date(start.getTime() + durationHours * 3600 * 1000);

        const formatForInput = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setStartTime(formatForInput(start));
        setEndTime(formatForInput(end));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");
            setError("");
            setTxHash("");

            const start = Math.floor(new Date(startTime).getTime() / 1000);
            const end = Math.floor(new Date(endTime).getTime() / 1000);
            const now = Math.floor(Date.now() / 1000);

            if (start <= now) {
                setError("Start time must be in the future (greater than current time).");
                setLoading(false);
                return;
            }

            if (end <= start) {
                setError("End time must be after start time.");
                setLoading(false);
                return;
            }

            const contract = await getVotingContract(true);

            setMessage("Please confirm transaction in MetaMask...");
            const tx = await contract.createElection(
                title.trim(),
                description.trim() || "No description",
                start,
                end
            );

            setTxHash(tx.hash);
            setMessage("Transaction submitted. Waiting for blockchain confirmation...");

            await tx.wait();

            setMessage("Election created successfully on the blockchain!");
            setTitle("");
            setDescription("");
            setStartTime("");
            setEndTime("");

            onElectionCreated?.();
        } catch (err: any) {
            console.error("Create election error:", err);
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
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🗳️</span> Create Election
                </h2>
                <button
                    type="button"
                    onClick={() => setQuickTime(2, 24)}
                    className="text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded transition-colors"
                >
                    + Set Test Times (+2m, 24h)
                </button>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Election Title *
                </label>
                <input
                    type="text"
                    placeholder="e.g. Presidential, Organizational, Board, or Community Election"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description
                </label>
                <textarea
                    rows={2}
                    placeholder="Brief description or rules of the election"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Start Time (Future) *
                    </label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        End Time *
                    </label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-blue-600/25"
            >
                {loading ? "Creating on Blockchain..." : "Create Election"}
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
