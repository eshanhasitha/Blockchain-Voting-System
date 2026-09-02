import { useState } from "react";
import { getVotingContract, formatMetaMaskError } from "../utils/blockchain";
import { CONTRACT_ADDRESS } from "../contracts/contractConfig";

export default function ContractTest() {
    const [result, setResult] = useState("");
    const [admin, setAdmin] = useState("");
    const [totalElections, setTotalElections] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const testContract = async () => {
        try {
            setLoading(true);
            setError("");
            setResult("Connecting to smart contract...");

            const contract = await getVotingContract(false);

            // Fetch admin and next election id to verify read access
            const contractAdmin = await contract.admin();
            const nextId = await contract.getNextElectionId();
            const electionCount = Number(nextId) - 1;

            setAdmin(contractAdmin);
            setTotalElections(electionCount);
            setResult("Smart contract connected successfully!");
        } catch (err: any) {
            console.error("Contract test error:", err);
            setResult("");
            setError(formatMetaMaskError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Smart Contract Connection Test
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5 break-all">
                        Target: {CONTRACT_ADDRESS}
                    </p>
                </div>

                <button
                    onClick={testContract}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-md shadow-emerald-600/25 shrink-0"
                >
                    {loading ? "Testing..." : "Test Contract"}
                </button>
            </div>

            {result && (
                <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs space-y-1">
                    <p className="font-semibold">{result}</p>
                    {admin && (
                        <p className="font-mono">
                            Admin Address: <span className="text-white">{admin}</span>
                        </p>
                    )}
                    {totalElections !== null && (
                        <p>Total Elections on Chain: <span className="font-bold text-white">{totalElections}</span></p>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-3 p-3 bg-red-950/60 border border-red-800/50 rounded-lg text-red-300 text-xs">
                    {error}
                </div>
            )}
        </div>
    );
}
