import { useEffect, useState } from "react";
import { ethers } from "ethers";

import VotingSystemABI from "../contracts/VotingSystem.json";

const CONTRACT_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function Voter() {
    const [account, setAccount] = useState("");
    const [contract, setContract] = useState(null);

    const [admin, setAdmin] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);

    const [isRegistered, setIsRegistered] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState(null);

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

            const provider = new ethers.BrowserProvider(
                window.ethereum
            );

            const accounts = await provider.send(
                "eth_requestAccounts",
                []
            );

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

            await loadBlockchainData(
                votingContract,
                userAddress
            );

        } catch (err) {
            console.error(err);

            setError(
                err.shortMessage ||
                err.message ||
                "Failed to connect wallet."
            );
        }
    }

    // =========================================================
    // LOAD BLOCKCHAIN DATA
    // =========================================================

    async function loadBlockchainData(
        votingContract,
        userAddress
    ) {
        try {
            setLoading(true);
            setError("");

            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            try {
                const adminAddress =
                    await votingContract.admin();

                setAdmin(adminAddress);
            } catch (err) {
                console.log("Admin not available:", err);
            }

            // -----------------------------------------------------
            // TOTAL VOTES
            // -----------------------------------------------------

            try {
                const votes =
                    await votingContract.totalVotes();

                setTotalVotes(Number(votes));
            } catch (err) {
                console.log(
                    "totalVotes() not available:",
                    err
                );
            }

            // -----------------------------------------------------
            // REGISTERED VOTER
            // -----------------------------------------------------

            try {
                const registered =
                    await votingContract.registeredVoters(
                        userAddress
                    );

                setIsRegistered(Boolean(registered));
            } catch (err) {
                console.log(
                    "registeredVoters() not available:",
                    err
                );
            }

            // -----------------------------------------------------
            // HAS VOTED
            // -----------------------------------------------------

            try {
                const voted =
                    await votingContract.hasVoted(
                        userAddress
                    );

                setHasVoted(Boolean(voted));
            } catch (err) {
                console.log(
                    "hasVoted() not available:",
                    err
                );
            }

            // -----------------------------------------------------
            // LOAD CANDIDATES
            // -----------------------------------------------------

            await loadCandidates(votingContract);

        } catch (err) {
            console.error(err);

            setError(
                err.shortMessage ||
                err.message ||
                "Failed to load blockchain data."
            );
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // LOAD CANDIDATES
    // =========================================================

    async function loadCandidates(votingContract) {
        try {
            let candidateList = [];

            // -----------------------------------------------------
            // OPTION 1:
            // getCandidates()
            // -----------------------------------------------------

            try {
                candidateList =
                    await votingContract.getCandidates();

                console.log(
                    "Candidates from getCandidates():",
                    candidateList
                );
            } catch (err) {
                console.log(
                    "getCandidates() not available."
                );
            }

            // -----------------------------------------------------
            // OPTION 2:
            // candidateCount() + getCandidate()
            // -----------------------------------------------------

            if (
                !candidateList ||
                candidateList.length === 0
            ) {
                try {
                    const count =
                        await votingContract.candidateCount();

                    const tempCandidates = [];

                    for (
                        let i = 0;
                        i < Number(count);
                        i++
                    ) {
                        const candidate =
                            await votingContract.getCandidate(i);

                        tempCandidates.push(candidate);
                    }

                    candidateList = tempCandidates;

                } catch (err) {
                    console.log(
                        "candidateCount/getCandidate unavailable."
                    );
                }
            }

            // -----------------------------------------------------
            // FORMAT CANDIDATES
            // -----------------------------------------------------

            const formattedCandidates =
                candidateList.map(
                    (candidate, index) => {

                        /*
                         * Supports:
                         *
                         * candidate.id
                         * candidate.name
                         * candidate.voteCount
                         *
                         * and tuple indexes:
                         *
                         * candidate[0]
                         * candidate[1]
                         * candidate[2]
                         */

                        const id =
                            candidate.id ??
                            candidate[0] ??
                            index;

                        const name =
                            candidate.name ??
                            candidate[1] ??
                            "Unknown Candidate";

                        const votes =
                            candidate.voteCount ??
                            candidate.votes ??
                            candidate[2] ??
                            0;

                        return {
                            id: Number(id),
                            name: name.toString(),
                            votes: Number(votes)
                        };
                    }
                );

            setCandidates(formattedCandidates);

        } catch (err) {
            console.error(
                "Candidate loading error:",
                err
            );

            setCandidates([]);
        }
    }

    // =========================================================
    // VOTE
    // =========================================================

    async function vote(candidateId) {
        try {
            setError("");
            setMessage("");

            if (!contract) {
                setError(
                    "Please connect your MetaMask wallet first."
                );
                return;
            }

            if (!isRegistered) {
                setError(
                    "You are not registered as a voter."
                );
                return;
            }

            if (hasVoted) {
                setError(
                    "You have already voted."
                );
                return;
            }

            setVotingId(candidateId);

            setMessage(
                "Please confirm the transaction in MetaMask..."
            );

            // -----------------------------------------------------
            // CALL SMART CONTRACT
            // -----------------------------------------------------

            const transaction =
                await contract.vote(candidateId);

            setMessage(
                "Vote transaction submitted. Waiting for confirmation..."
            );

            console.log(
                "Transaction:",
                transaction.hash
            );

            // -----------------------------------------------------
            // WAIT FOR BLOCKCHAIN CONFIRMATION
            // -----------------------------------------------------

            await transaction.wait();

            setMessage(
                "Your vote was successfully recorded!"
            );

            setHasVoted(true);

            // -----------------------------------------------------
            // REFRESH DATA
            // -----------------------------------------------------

            await loadBlockchainData(
                contract,
                account
            );

        } catch (err) {
            console.error(
                "Voting error:",
                err
            );

            let errorMessage =
                "Failed to cast vote.";

            if (err.reason) {
                errorMessage = err.reason;
            } else if (err.shortMessage) {
                errorMessage = err.shortMessage;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);

        } finally {
            setVotingId(null);
        }
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
                const provider =
                    new ethers.BrowserProvider(
                        window.ethereum
                    );

                const accounts =
                    await provider.send(
                        "eth_accounts",
                        []
                    );

                if (accounts.length > 0) {
                    const signer =
                        await provider.getSigner();

                    const votingContract =
                        new ethers.Contract(
                            CONTRACT_ADDRESS,
                            VotingSystemABI.abi,
                            signer
                        );

                    setAccount(accounts[0]);
                    setContract(votingContract);

                    await loadBlockchainData(
                        votingContract,
                        accounts[0]
                    );
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
    // META MASK ACCOUNT CHANGE
    // =========================================================

    useEffect(() => {
        if (!window.ethereum) return;

        function handleAccountsChanged(accounts) {
            if (accounts.length === 0) {
                setAccount("");
                setContract(null);
                setCandidates([]);
                setIsRegistered(false);
                setHasVoted(false);
            } else {
                window.location.reload();
            }
        }

        window.ethereum.on(
            "accountsChanged",
            handleAccountsChanged
        );

        return () => {
            window.ethereum.removeListener(
                "accountsChanged",
                handleAccountsChanged
            );
        };
    }, []);

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-950 text-white px-6 py-10">

            <div className="max-w-5xl mx-auto">

                {/* =================================================
            HEADER
        ================================================= */}

                <div className="text-center mb-10">

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        University Voting
                    </h1>

                    <p className="text-gray-400">
                        Secure Blockchain-Based Voting
                    </p>

                </div>


                {/* =================================================
            WALLET
        ================================================= */}

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">

                    {!account ? (

                        <div className="text-center">

                            <p className="text-gray-400 mb-4">
                                Connect your MetaMask wallet to vote.
                            </p>

                            <button
                                onClick={connectWallet}
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
                            >
                                Connect MetaMask
                            </button>

                        </div>

                    ) : (

                        <div>

                            <p className="text-green-400 font-semibold mb-2">
                                Wallet Connected
                            </p>

                            <p className="text-gray-300 break-all">
                                {account}
                            </p>

                        </div>

                    )}

                </div>


                {/* =================================================
            STATUS
        ================================================= */}

                {account && (

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">

                            <p className="text-gray-400">
                                Registration
                            </p>

                            <p className="text-xl font-bold mt-2">

                                {isRegistered
                                    ? "Registered"
                                    : "Not Registered"}

                            </p>

                        </div>


                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">

                            <p className="text-gray-400">
                                Voting Status
                            </p>

                            <p className="text-xl font-bold mt-2">

                                {hasVoted
                                    ? "Vote Submitted"
                                    : "Not Voted"}

                            </p>

                        </div>


                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">

                            <p className="text-gray-400">
                                Total Votes
                            </p>

                            <p className="text-xl font-bold mt-2">
                                {totalVotes}
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
            MESSAGES
        ================================================= */}

                {message && (

                    <div className="bg-blue-950 border border-blue-800 text-blue-300 rounded-lg p-4 mb-6">
                        {message}
                    </div>

                )}


                {error && (

                    <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
                        {error}
                    </div>

                )}


                {/* =================================================
            ADMIN
        ================================================= */}

                {admin && (

                    <div className="text-center text-sm text-gray-500 mb-8">

                        Contract Admin:

                        <span className="ml-2">
                            {admin}
                        </span>

                    </div>

                )}


                {/* =================================================
            CANDIDATES
        ================================================= */}

                <div>

                    <h2 className="text-3xl font-bold mb-6">
                        Candidates
                    </h2>


                    {loading ? (

                        <div className="text-center py-10">
                            <p className="text-gray-400">
                                Loading blockchain data...
                            </p>
                        </div>

                    ) : candidates.length === 0 ? (

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">

                            <p className="text-gray-400">
                                No candidates available.
                            </p>

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {candidates.map(
                                (candidate) => (

                                    <div
                                        key={candidate.id}
                                        className="bg-gray-900 border border-gray-800 rounded-xl p-6"
                                    >

                                        {/* Candidate Name */}

                                        <h3 className="text-2xl font-bold mb-3">
                                            {candidate.name}
                                        </h3>


                                        {/* Votes */}

                                        <p className="text-gray-400 mb-6">

                                            Votes:

                                            <span className="text-white font-bold ml-2">
                                                {candidate.votes}
                                            </span>

                                        </p>


                                        {/* Vote Button */}

                                        <button
                                            onClick={() =>
                                                vote(candidate.id)
                                            }
                                            disabled={
                                                !account ||
                                                !isRegistered ||
                                                hasVoted ||
                                                votingId !== null
                                            }
                                            className={`w-full py-3 rounded-lg font-semibold ${!account ||
                                                !isRegistered ||
                                                hasVoted ||
                                                votingId !== null
                                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700"
                                                }`}
                                        >

                                            {votingId === candidate.id
                                                ? "Voting..."
                                                : hasVoted
                                                    ? "Already Voted"
                                                    : !isRegistered
                                                        ? "Not Registered"
                                                        : "Vote"}

                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Voter;