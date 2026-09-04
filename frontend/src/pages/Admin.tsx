import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ethers } from "ethers";
import VotingSystemABI from "../contracts/VotingSystem.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

interface CandidateData {
    id: number;
    name: string;
    description: string;
    voteCount: number;
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

function Admin() {
    const navigate = useNavigate();
    const [account, setAccount] = useState("");
    const [contractAdmin, setContractAdmin] = useState("");
    const [contract, setContract] = useState<ethers.Contract | null>(null);

    const storedUser = localStorage.getItem("user");
    const adminUser = storedUser ? JSON.parse(storedUser) : null;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Create Election
    const [electionTitle, setElectionTitle] = useState("");
    const [electionDescription, setElectionDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Add Candidate
    const [candidateName, setCandidateName] = useState("");
    const [candidateDescription, setCandidateDescription] = useState("");
    const [candidateElectionId, setCandidateElectionId] = useState("");

    // Authorize Voter
    const [voterAddress, setVoterAddress] = useState("");
    const [voterElectionId, setVoterElectionId] = useState("");

    // State
    const [elections, setElections] = useState<ElectionData[]>([]);
    const [candidates, setCandidates] = useState<CandidateData[]>([]);
    const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
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
                setError("Please install MetaMask.");
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            const votingContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                VotingSystemABI.abi,
                signer
            );

            setAccount(accounts[0]);
            setContract(votingContract);

            try {
                const adminAddress = await votingContract.admin();
                setContractAdmin(adminAddress);
            } catch (err) {
                console.warn("Could not fetch contract admin:", err);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    }

    // =========================================================
    // CREATE ELECTION
    // =========================================================

    async function createElection() {
        if (!contract) {
            setError("Connect wallet first.");
            return;
        }

        if (!electionTitle.trim()) {
            setError("Enter election title.");
            return;
        }

        if (!startTime || !endTime) {
            setError("Set start and end times.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("Creating election...");

            const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

            const tx = await contract.createElection(
                electionTitle,
                electionDescription || "No description",
                startTimestamp,
                endTimestamp
            );

            await tx.wait();

            setMessage("Election created successfully!");
            setElectionTitle("");
            setElectionDescription("");
            setStartTime("");
            setEndTime("");

            await loadElections();
        } catch (err: any) {
            console.error(err);
            setError(err.reason || err.message);
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // ADD CANDIDATE
    // =========================================================

    async function addCandidate() {
        if (!contract) {
            setError("Connect wallet first.");
            return;
        }

        if (!candidateName.trim()) {
            setError("Enter candidate name.");
            return;
        }

        if (!candidateElectionId) {
            setError("Enter election ID.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("Adding candidate...");

            const tx = await contract.addCandidate(
                Number(candidateElectionId),
                candidateName,
                candidateDescription || "No description"
            );

            await tx.wait();

            setMessage("Candidate added successfully!");
            setCandidateName("");
            setCandidateDescription("");

            if (selectedElectionId) {
                await loadCandidates(selectedElectionId);
            }
            await loadElections();
        } catch (err: any) {
            console.error(err);
            setError(err.reason || err.message);
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // AUTHORIZE VOTER
    // =========================================================

    async function authorizeVoter() {
        if (!contract) {
            setError("Connect wallet first.");
            return;
        }

        if (!ethers.isAddress(voterAddress)) {
            setError("Invalid Ethereum address.");
            return;
        }

        if (!voterElectionId) {
            setError("Enter election ID.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("Authorizing voter...");

            const tx = await contract.authorizeVoter(
                Number(voterElectionId),
                voterAddress
            );

            await tx.wait();

            setMessage("Voter authorized successfully!");
            setVoterAddress("");
        } catch (err: any) {
            console.error(err);
            setError(err.reason || err.message);
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // LOAD ELECTIONS
    // =========================================================

    async function loadElections() {
        if (!contract) return;

        try {
            const nextId = await contract.getNextElectionId();
            const numElections = Number(nextId) - 1;

            const electionList: ElectionData[] = [];

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
        } catch (err) {
            console.error("Loading error:", err);
        }
    }

    // =========================================================
    // LOAD CANDIDATES FOR AN ELECTION
    // =========================================================

    async function loadCandidates(electionId: number) {
        if (!contract) return;

        try {
            const count = await contract.getCandidateCount(electionId);
            const candidateList: CandidateData[] = [];

            for (let i = 1; i <= Number(count); i++) {
                try {
                    const candidate = await contract.getCandidate(electionId, i);

                    candidateList.push({
                        id: Number(candidate[0]),
                        name: candidate[1],
                        description: candidate[2],
                        voteCount: Number(candidate[3]),
                    });
                } catch (e) {
                    console.warn(`Could not load candidate ${i}:`, e);
                }
            }

            setCandidates(candidateList);
            setSelectedElectionId(electionId);
        } catch (err) {
            console.error("Loading candidates error:", err);
        }
    }

    // =========================================================
    // EFFECTS
    // =========================================================

    useEffect(() => {
        if (contract) {
            loadElections();
        }
    }, [contract]);

    useEffect(() => {
        if (!window.ethereum) return;

        function handleAccountsChanged() {
            window.location.reload();
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

    const totalElections = elections.length;
    const activeElections = elections.filter((e) => e.status === "ACTIVE").length;
    const totalVotesCount = elections.reduce((sum, e) => sum + (e.totalVotes || 0), 0);

    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">

            <div className="max-w-6xl mx-auto">

                {/* HEADER & WELCOME */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Welcome, <span className="text-white font-semibold">{adminUser?.name || "Administrator"}</span> ({adminUser?.email || "admin"})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/results"
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-xl border border-gray-700 transition-colors"
                        >
                            View Results
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-sm font-medium rounded-xl transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* STAT METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl text-center">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Elections</p>
                        <p className="text-4xl font-extrabold text-white">{totalElections}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl text-center">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Active Elections</p>
                        <p className="text-4xl font-extrabold text-green-400">{activeElections}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl text-center">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Votes</p>
                        <p className="text-4xl font-extrabold text-blue-400">{totalVotesCount}</p>
                    </div>
                </div>

                {/* QUICK ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                    <a
                        href="#create-election"
                        className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>📋</span> Create Election
                    </a>
                    <a
                        href="#add-candidate"
                        className="px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>👤</span> Add Candidate
                    </a>
                    <a
                        href="#authorize-voter"
                        className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>✅</span> Register Voter
                    </a>
                    <Link
                        to="/results"
                        className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>📊</span> View Results
                    </Link>
                </div>

                {/* CONNECT */}

                {!account && (
                    <div className="text-center mb-8">
                        <button
                            onClick={connectWallet}
                            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                )}

                {account && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 text-center space-y-2">
                        <div>
                            <span className="text-gray-400 text-sm">Connected Wallet: </span>
                            <span className="text-blue-400 font-mono text-sm">{account}</span>
                        </div>
                        {contractAdmin && (
                            <div>
                                <span className="text-gray-400 text-sm">Contract Admin: </span>
                                <span className="text-green-400 font-mono text-sm">{contractAdmin}</span>
                            </div>
                        )}
                        {contractAdmin && account.toLowerCase() !== contractAdmin.toLowerCase() && (
                            <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-300 text-xs font-medium mt-2">
                                ⚠️ <strong>Warning:</strong> You are not connected with the Admin wallet ({contractAdmin.slice(0, 6)}...{contractAdmin.slice(-4)}). Switch your MetaMask account to the admin address to execute admin actions.
                            </div>
                        )}
                    </div>
                )}

                {/* MESSAGES */}

                {message && (
                    <div className="bg-green-950/50 border border-green-800/50 text-green-400 p-4 rounded-xl mb-6 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 text-red-400 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* ACTION CARDS */}

                <div className="grid md:grid-cols-3 gap-6 mb-10">

                    {/* CREATE ELECTION */}

                    <div id="create-election" className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl scroll-mt-24">

                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">📋</span>
                            Create Election
                        </h2>

                        <input
                            value={electionTitle}
                            onChange={(e) => setElectionTitle(e.target.value)}
                            placeholder="Election title"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />

                        <input
                            value={electionDescription}
                            onChange={(e) => setElectionDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />

                        <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                        />

                        <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-4 text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                        />

                        <button
                            onClick={createElection}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-lg font-semibold transition-all duration-200 text-sm"
                        >
                            Create Election
                        </button>
                    </div>

                    {/* ADD CANDIDATE */}

                    <div id="add-candidate" className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl scroll-mt-24">

                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-green-400">👤</span>
                            Add Candidate
                        </h2>

                        <input
                            value={candidateElectionId}
                            onChange={(e) => setCandidateElectionId(e.target.value)}
                            placeholder="Election ID"
                            type="number"
                            min="1"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />

                        <input
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Candidate name"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />

                        <input
                            value={candidateDescription}
                            onChange={(e) => setCandidateDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-4 text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />

                        <button
                            onClick={addCandidate}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 p-3 rounded-lg font-semibold transition-all duration-200 text-sm"
                        >
                            Add Candidate
                        </button>
                    </div>

                    {/* AUTHORIZE VOTER */}

                    <div id="authorize-voter" className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl scroll-mt-24">

                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400">✅</span>
                            Authorize Voter
                        </h2>

                        <input
                            value={voterElectionId}
                            onChange={(e) => setVoterElectionId(e.target.value)}
                            placeholder="Election ID"
                            type="number"
                            min="1"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />

                        <input
                            value={voterAddress}
                            onChange={(e) => setVoterAddress(e.target.value)}
                            placeholder="0x... wallet address"
                            className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-4 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />

                        <button
                            onClick={authorizeVoter}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 p-3 rounded-lg font-semibold transition-all duration-200 text-sm"
                        >
                            Authorize Voter
                        </button>
                    </div>

                </div>

                {/* ELECTIONS LIST */}

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">

                    <h2 className="text-2xl font-bold mb-6">Elections</h2>

                    {elections.length === 0 ? (

                        <p className="text-gray-500 text-center py-8">
                            No elections created yet.
                        </p>

                    ) : (

                        <div className="grid md:grid-cols-2 gap-4">

                            {elections.map((election) => (
                                <div
                                    key={election.id}
                                    onClick={() => loadCandidates(election.id)}
                                    className={`bg-gray-800/50 border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-blue-500/50 ${
                                        selectedElectionId === election.id
                                            ? "border-blue-500"
                                            : "border-gray-700"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold">
                                            #{election.id} — {election.title}
                                        </h3>

                                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(election.status)}`}>
                                            {election.status}
                                        </span>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-3">{election.description}</p>

                                    <div className="grid grid-cols-3 gap-3 text-center">

                                        <div className="bg-gray-900/50 rounded-lg p-2">
                                            <p className="text-xs text-gray-500">Candidates</p>
                                            <p className="text-lg font-bold">{election.candidateCount}</p>
                                        </div>

                                        <div className="bg-gray-900/50 rounded-lg p-2">
                                            <p className="text-xs text-gray-500">Total Votes</p>
                                            <p className="text-lg font-bold">{election.totalVotes}</p>
                                        </div>

                                        <div className="bg-gray-900/50 rounded-lg p-2">
                                            <p className="text-xs text-gray-500">Starts</p>
                                            <p className="text-xs font-medium">{formatTimestamp(election.startTime)}</p>
                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

                </div>

                {/* CANDIDATES FOR SELECTED ELECTION */}

                {selectedElectionId && (

                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">

                        <h2 className="text-2xl font-bold mb-6">
                            Candidates — Election #{selectedElectionId}
                        </h2>

                        {candidates.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No candidates added yet.
                            </p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {candidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl"
                                    >
                                        <h3 className="text-lg font-bold mb-1">
                                            {candidate.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-2">
                                            {candidate.description}
                                        </p>
                                        <p className="text-blue-400 font-semibold">
                                            {candidate.voteCount} votes
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}

export default Admin;