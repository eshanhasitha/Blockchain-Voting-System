import { useState } from "react";
import { ethers } from "ethers";
import { getVotingContract, formatMetaMaskError } from "../utils/blockchain";

interface RegisterVoterProps {
    defaultElectionId?: number;
    onVoterRegistered?: () => void;
}

export default function RegisterVoter({
    defaultElectionId,
    onVoterRegistered,
}: RegisterVoterProps) {
    const [electionId, setElectionId] = useState(
        defaultElectionId ? defaultElectionId.toString() : ""
    );
    const [voterAddress, setVoterAddress] = useState("");

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");
            setError("");
            setTxHash("");

            if (!electionId || Number(electionId) <= 0) {
                setError("Please enter a valid Election ID.");
                setLoading(false);
                return;
            }

            const cleanAddress = voterAddress.trim();
            if (!ethers.isAddress(cleanAddress)) {
                setError("Invalid Ethereum wallet address format (must start with 0x and be 42 characters).");
                setLoading(false);
                return;
            }

            const contract = await getVotingContract(true);

            setMessage("Please confirm transaction in MetaMask...");
            const tx = await contract.authorizeVoter(
                Number(electionId),
                cleanAddress
            );

            setTxHash(tx.hash);
            setMessage("Transaction submitted. Waiting for blockchain confirmation...");

            await tx.wait();

            setMessage(`Voter ${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)} authorized successfully!`);
            setVoterAddress("");

            onVoterRegistered?.();
        } catch (err: any) {
            console.error("Register voter error:", err);
            setError(formatMetaMaskError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleRegister}
            className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-lg space-y-4"
        >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔐</span> Register / Authorize Voter
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
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                    Voter Wallet Address (0x...) *
                </label>
                <input
                    type="text"
                    placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                    value={voterAddress}
                    onChange={(e) => setVoterAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-800 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-purple-600/25"
            >
                {loading ? "Registering on Blockchain..." : "Register Voter"}
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
