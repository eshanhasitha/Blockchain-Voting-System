import { useEffect, useState } from "react";
import { ethers } from "ethers";
import VotingSystemABI from "../contracts/VotingSystem.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

interface CandidateData {
    id: number;
    name: string;
    description: string;
    votes: number;
}

interface ElectionData {
    id: number;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    candidateCount: number;
    totalVotes: number;
    status: string;
}

function Voter() {
    const [account, setAccount] = useState("");
    const [contract, setContract] = useState<ethers.Contract | null>(null);

    const [admin, setAdmin] = useState("");
    const [elections, setElections] = useState<ElectionData[]>([]);
    const [candidates, setCandidates] = useState<CandidateData[]>([]);
    const [selectedElection, setSelectedElection] = useState<ElectionData | null>(null);

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<number | null>(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =========================================================
    // CONNECT WALLET
    // =========================================================

    async function connectWallet() {
        try {
            setError("");
            setMessage("");

            if (!window.ethereum) {
                setError("MetaMask is not installed.");
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const userAddress = accounts[0];

            setAccount(userAddress);

            const votingContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                VotingSystemABI.abi,
                signer
            );

            setContract(votingContract);
            setMessage("Wallet connected.");

            await loadElections(votingContract, userAddress);

        } catch (err: any) {
            console.error(err);
            setError(err.shortMessage || err.message || "Failed to connect wallet.");
        }
    }

    // =========================================================
    // LOAD ELECTIONS
    // =========================================================

    async function loadElections(
        votingContract: ethers.Contract,
        userAddress?: string
    ) {
        try {
            setLoading(true);
            setError("");

            // Admin
            try {
                const adminAddress = await votingContract.admin();
                setAdmin(adminAddress);
            } catch (err) {
                console.log("Admin not available:", err);
            }

            // Elections
            const nextId = await votingContract.getNextElectionId();
            const numElections = Number(nextId) - 1;

            const electionList: ElectionData[] = [];

            for (let i = 1; i <= numElections; i++) {
                try {
                    const election = await votingContract.getElection(i);
                    const status = await votingContract.getElectionStatus(i);

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

            // Auto-select first active election
            const activeElection = electionList.find((e) => e.status === "ACTIVE");
            if (activeElection && userAddress) {
                await selectElection(votingContract, activeElection, userAddress);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.shortMessage || err.message || "Failed to load elections.");
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // SELECT ELECTION
    // =========================================================

    async function selectElection(
        votingContract: ethers.Contract,
        election: ElectionData,
        userAddress: string
    ) {
        try {
            setSelectedElection(election);

            // Check voter authorization
            try {
                const authorized = await votingContract.isAuthorizedVoter(
                    election.id,
                    userAddress
                );
                setIsAuthorized(Boolean(authorized));
            } catch (err) {
                console.log("isAuthorizedVoter not available:", err);
                setIsAuthorized(false);
            }

            // Check if voted
            try {
                const voted = await votingContract.hasVoterVoted(
                    election.id,
                    userAddress
                );
                setHasVoted(Boolean(voted));
            } catch (err) {
                console.log("hasVoterVoted not available:", err);
                setHasVoted(false);
            }

            // Load candidates
            await loadCandidates(votingContract, election.id);

        } catch (err: any) {
            console.error(err);
        }
    }

    // =========================================================
    // LOAD CANDIDATES
    // =========================================================

    async function loadCandidates(
        votingContract: ethers.Contract,
        electionId: number
    ) {
        try {
            const count = await votingContract.getCandidateCount(electionId);
            const candidateList: CandidateData[] = [];

            for (let i = 1; i <= Number(count); i++) {
                try {
                    const candidate = await votingContract.getCandidate(electionId, i);

                    candidateList.push({
                        id: Number(candidate[0]),
                        name: candidate[1],
                        description: candidate[2],
                        votes: Number(candidate[3]),
                    });
                } catch (e) {
                    console.warn(`Could not load candidate ${i}:`, e);
                }
            }

            setCandidates(candidateList);

        } catch (err) {
            console.error("Candidate loading error:", err);
            setCandidates([]);
        }
    }

    // =========================================================
    // VOTE
    // =========================================================

    async function vote(candidateId: number) {
        try {
            setError("");
            setMessage("");

            if (!contract || !selectedElection) {
                setError("Please connect wallet and select an election.");
                return;
            }

            if (!isAuthorized) {
                setError("You are not authorized to vote in this election.");
                return;
            }

            if (hasVoted) {
                setError("You have already voted in this election.");
                return;
            }

            setVotingId(candidateId);
            setMessage("Please confirm the transaction in MetaMask...");

            const transaction = await contract.castVote(
                selectedElection.id,
                candidateId
            );

            setMessage("Vote transaction submitted. Waiting for confirmation...");
            console.log("Transaction:", transaction.hash);

            await transaction.wait();

            setMessage("Your vote was successfully recorded!");
            setHasVoted(true);

            // Refresh
            await loadElections(contract, account);

        } catch (err: any) {
            console.error("Voting error:", err);

            let errorMessage = "Failed to cast vote.";
            if (err.reason) errorMessage = err.reason;
            else if (err.shortMessage) errorMessage = err.shortMessage;
            else if (err.message) errorMessage = err.message;

            setError(errorMessage);
        } finally {
            setVotingId(null);
        }
    }

    // =========================================================
    // HANDLE ELECTION CLICK
    // =========================================================

    async function handleElectionClick(election: ElectionData) {
        if (!contract || !account) return;
        await selectElection(contract, election, account);
    }

    // =========================================================
    // INITIAL WALLET CHECK
    // =========================================================

    useEffect(() => {
        async function checkWallet() {
            if (!window.ethereum) {
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_accounts", []);

                if (accounts.length > 0) {
                    const signer = await provider.getSigner();

                    const votingContract = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        VotingSystemABI.abi,
                        signer
                    );

                    setAccount(accounts[0]);
                    setContract(votingContract);

                    await loadElections(votingContract, accounts[0]);
                } else {
                    setLoading(false);
                }

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }

        checkWallet();
    }, []);

    // =========================================================
    // ACCOUNT CHANGE HANDLER
    // =========================================================

    useEffect(() => {
        if (!window.ethereum) return;

        function handleAccountsChanged(accounts: string[]) {
            if (accounts.length === 0) {
                setAccount("");
                setContract(null);
                setCandidates([]);
                setIsAuthorized(false);
                setHasVoted(false);
            } else {
                window.location.reload();
            }
        }

        function handleChainChanged() {
            window.location.reload();
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, []);

    // =========================================================
    // HELPERS
    // =========================================================

    function formatTimestamp(ts: number) {
        return new Date(ts * 1000).toLocaleString();
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "ACTIVE": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "UPCOMING": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "ENDED": return "text-gray-400 bg-gray-400/10 border-gray-400/20";
            default: return "text-gray-400";
        }
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Blockchain Voting System
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Secure, Transparent & Decentralized Voting for Any Election
                    </p>
                </div>

                {/* WALLET */}

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">

                    {!account ? (
                        <div className="text-center">
                            <p className="text-gray-400 mb-4">
                                Connect your MetaMask wallet to vote.
                            </p>
                            <button
                                onClick={connectWallet}
                                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
                            >
                                Connect MetaMask
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-green-400 font-semibold mb-1 text-sm">
                                ✓ Wallet Connected
                            </p>
                            <p className="text-gray-300 break-all font-mono text-sm">
                                {account}
                            </p>
                        </div>
                    )}

                </div>

                {/* STATUS CARDS */}

                {account && selectedElection && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Authorization</p>
                            <p className={`text-lg font-bold mt-2 ${isAuthorized ? "text-green-400" : "text-red-400"}`}>
                                {isAuthorized ? "✓ Authorized" : "✗ Not Authorized"}
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Voting Status</p>
                            <p className={`text-lg font-bold mt-2 ${hasVoted ? "text-blue-400" : "text-yellow-400"}`}>
                                {hasVoted ? "✓ Vote Submitted" : "○ Not Voted"}
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Total Votes</p>
                            <p className="text-lg font-bold mt-2">
                                {selectedElection.totalVotes}
                            </p>
                        </div>

                    </div>
                )}

                {/* MESSAGES */}

                {message && (
                    <div className="bg-blue-950/50 border border-blue-800/50 text-blue-300 rounded-xl p-4 mb-6 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl p-4 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* ADMIN INFO */}

                {admin && (
                    <div className="text-center text-xs text-gray-600 mb-8">
                        Contract Admin: <span className="font-mono text-gray-500">{admin}</span>
                    </div>
                )}

                {/* ELECTIONS SELECTOR */}

                {elections.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Elections</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {elections.map((election) => (
                                <div
                                    key={election.id}
                                    onClick={() => handleElectionClick(election)}
                                    className={`bg-gray-900/50 border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-blue-500/50 ${
                                        selectedElection?.id === election.id
                                            ? "border-blue-500 shadow-lg shadow-blue-500/10"
                                            : "border-gray-800"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold">{election.title}</h3>
                                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(election.status)}`}>
                                            {election.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-2">{election.description}</p>
                                    <p className="text-gray-600 text-xs">
                                        {formatTimestamp(election.startTime)} — {formatTimestamp(election.endTime)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CANDIDATES */}

                <div>
                    <h2 className="text-2xl font-bold mb-6">
                        {selectedElection ? `Candidates — ${selectedElection.title}` : "Candidates"}
                    </h2>

                    {loading ? (

                        <div className="text-center py-10">
                            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400">Loading blockchain data...</p>
                        </div>

                    ) : !selectedElection ? (

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                            <p className="text-gray-500">Select an election above to see candidates.</p>
                        </div>

                    ) : candidates.length === 0 ? (

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No candidates available for this election.</p>
                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {candidates.map((candidate) => (

                                <div
                                    key={candidate.id}
                                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 transition-all duration-200 hover:border-gray-700"
                                >
                                    <h3 className="text-xl font-bold mb-1">
                                        {candidate.name}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-4">
                                        {candidate.description}
                                    </p>

                                    <p className="text-gray-400 mb-6">
                                        Votes:
                                        <span className="text-white font-bold ml-2">
                                            {candidate.votes}
                                        </span>
                                    </p>

                                    <button
                                        onClick={() => vote(candidate.id)}
                                        disabled={
                                            !account ||
                                            !isAuthorized ||
                                            hasVoted ||
                                            votingId !== null ||
                                            selectedElection?.status !== "ACTIVE"
                                        }
                                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                                            !account || !isAuthorized || hasVoted || votingId !== null || selectedElection?.status !== "ACTIVE"
                                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                                        }`}
                                    >
                                        {votingId === candidate.id
                                            ? "Voting..."
                                            : hasVoted
                                                ? "Already Voted"
                                                : !isAuthorized
                                                    ? "Not Authorized"
                                                    : selectedElection?.status !== "ACTIVE"
                                                        ? "Election Not Active"
                                                        : "Vote"}
                                    </button>

                                </div>
                            ))}

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

export default Voter;