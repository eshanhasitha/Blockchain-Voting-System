import { useEffect, useState } from "react";
import { ethers } from "ethers";
import VotingSystemABI from "../contracts/VotingSystem.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

interface CandidateResult {
    id: number;
    name: string;
    description: string;
    votes: number;
}

interface ElectionResult {
    id: number;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    candidateCount: number;
    totalVotes: number;
    status: string;
}

function Results() {
    const [elections, setElections] = useState<ElectionResult[]>([]);
    const [candidates, setCandidates] = useState<CandidateResult[]>([]);
    const [selectedElection, setSelectedElection] = useState<ElectionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadElections() {
        try {
            setLoading(true);

            if (!window.ethereum) {
                throw new Error("MetaMask is required.");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);

            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                VotingSystemABI.abi,
                provider
            );

            const nextId = await contract.getNextElectionId();
            const numElections = Number(nextId) - 1;

            const electionList: ElectionResult[] = [];

            for (let i = 1; i <= numElections; i++) {
                try {
                    const election = await contract.getElection(i);
                    const status = await contract.getElectionStatus(i);

                    electionList.push({
                        id: Number(election[0]),
                        title: election[1],
                        description: election[2],
                        startTime: Number(election[3]),
                        endTime: Number(election[4]),
                        candidateCount: Number(election[5]),
                        totalVotes: Number(election[6]),
                        status: status,
                    });
                } catch (e) {
                    console.warn(`Could not load election ${i}:`, e);
                }
            }

            setElections(electionList);

            // Auto-select first election with votes, or first election
            const withVotes = electionList.find((e) => e.totalVotes > 0);
            const first = withVotes || electionList[0];

            if (first) {
                await loadCandidates(contract, first);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.reason || err.message || "Failed to load results.");
        } finally {
            setLoading(false);
        }
    }

    async function loadCandidates(contract: ethers.Contract, election: ElectionResult) {
        try {
            setSelectedElection(election);

            const count = await contract.getCandidateCount(election.id);
            const result: CandidateResult[] = [];

            for (let i = 1; i <= Number(count); i++) {
                try {
                    const candidate = await contract.getCandidate(election.id, i);

                    result.push({
                        id: Number(candidate[0]),
                        name: candidate[1],
                        description: candidate[2],
                        votes: Number(candidate[3]),
                    });
                } catch (e) {
                    console.warn(`Could not load candidate ${i}:`, e);
                }
            }

            // Sort by votes descending
            result.sort((a, b) => b.votes - a.votes);
            setCandidates(result);

        } catch (err: any) {
            console.error(err);
        }
    }

    async function handleElectionClick(election: ElectionResult) {
        if (!window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            VotingSystemABI.abi,
            provider
        );

        await loadCandidates(contract, election);
    }

    useEffect(() => {
        loadElections();
    }, []);

    // =========================================================
    // HELPERS
    // =========================================================

    function getStatusColor(status: string) {
        switch (status) {
            case "ACTIVE": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "UPCOMING": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "ENDED": return "text-gray-400 bg-gray-400/10 border-gray-400/20";
            default: return "text-gray-400";
        }
    }

    function getBarColor(index: number) {
        const colors = [
            "bg-gradient-to-r from-blue-500 to-blue-400",
            "bg-gradient-to-r from-purple-500 to-purple-400",
            "bg-gradient-to-r from-green-500 to-green-400",
            "bg-gradient-to-r from-orange-500 to-orange-400",
            "bg-gradient-to-r from-pink-500 to-pink-400",
            "bg-gradient-to-r from-cyan-500 to-cyan-400",
        ];
        return colors[index % colors.length];
    }

    // =========================================================
    // UI
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">

            <div className="max-w-4xl mx-auto">

                <h1 className="text-4xl font-bold text-center mb-2">
                    Election Results
                </h1>

                <p className="text-gray-500 text-center mb-10">
                    Live results from the blockchain
                </p>

                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 text-red-400 rounded-xl p-4 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* ELECTION SELECTOR */}

                {elections.length > 1 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3 text-gray-300">Select Election</h2>
                        <div className="flex flex-wrap gap-3">
                            {elections.map((election) => (
                                <button
                                    key={election.id}
                                    onClick={() => handleElectionClick(election)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                                        selectedElection?.id === election.id
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-600"
                                    }`}
                                >
                                    #{election.id} — {election.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUMMARY CARDS */}

                {selectedElection && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Election</p>
                            <p className="text-lg font-bold">{selectedElection.title}</p>
                            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(selectedElection.status)}`}>
                                {selectedElection.status}
                            </span>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Total Votes</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                {selectedElection.totalVotes}
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Candidates</p>
                            <p className="text-4xl font-bold">{selectedElection.candidateCount}</p>
                        </div>

                    </div>
                )}

                {/* RESULTS */}

                {elections.length === 0 ? (

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                        <p className="text-gray-500">No elections found.</p>
                    </div>

                ) : candidates.length === 0 ? (

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                        <p className="text-gray-500">No candidates in this election.</p>
                    </div>

                ) : (

                    <div className="space-y-4">
                        {candidates.map((candidate, index) => {
                            const totalVotes = selectedElection?.totalVotes || 0;
                            const percentage = totalVotes === 0
                                ? 0
                                : (candidate.votes / totalVotes) * 100;

                            const isWinner = index === 0 && candidate.votes > 0;

                            return (
                                <div
                                    key={candidate.id}
                                    className={`bg-gray-900/50 border rounded-xl p-6 transition-all duration-200 ${
                                        isWinner ? "border-yellow-500/50" : "border-gray-800"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {isWinner && (
                                                <span className="text-yellow-400 text-xl">🏆</span>
                                            )}
                                            <div>
                                                <h2 className="text-lg font-bold">{candidate.name}</h2>
                                                <p className="text-gray-500 text-sm">{candidate.description}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold">{candidate.votes} votes</p>
                                            <p className="text-gray-500 text-sm">{percentage.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-700 ${getBarColor(index)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}

export default Results;