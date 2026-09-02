import { useState } from "react";
import { getVotingContract, formatMetaMaskError } from "../utils/blockchain";

interface VoteButtonProps {
    electionId: number;
    candidateId: number;
    disabled?: boolean;
    onVoteSuccess?: () => void;
}

export default function VoteButton({
    electionId,
    candidateId,
    disabled = false,
    onVoteSuccess,
}: VoteButtonProps) {
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const vote = async () => {
        try {
            setLoading(true);
            setMessage("");
            setError("");
            setTxHash("");

            const contract = await getVotingContract(true);

            setMessage("Please confirm your vote in MetaMask...");
            const tx = await contract.castVote(
                Number(electionId),
                Number(candidateId)
            );

            setTxHash(tx.hash);
            setMessage("Vote submitted! Waiting for blockchain confirmation...");

            await tx.wait();

            setMessage("Vote successfully recorded on the blockchain!");
            onVoteSuccess?.();
        } catch (err: any) {
            console.error("Voting error:", err);
            setError(formatMetaMaskError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={vote}
                disabled={disabled || loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-blue-600/25"
            >
                {loading ? "Recording on Blockchain..." : "Vote"}
            </button>

            {message && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs">
                    <p>{message}</p>
                    {txHash && (
                        <p className="mt-0.5 font-mono text-[10px] text-emerald-400 break-all">
                            Tx: {txHash}
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className="p-2.5 bg-red-950/60 border border-red-800/50 rounded-lg text-red-300 text-xs">
                    {error}
                </div>
            )}
        </div>
    );
}
