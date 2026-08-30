import { useEffect, useState } from "react";

import {
    getContract
} from "../utils/contract";


function BlockchainStatus() {

    const [admin, setAdmin] =
        useState("");

    const [totalVotes, setTotalVotes] =
        useState(0);

    const [candidateCount, setCandidateCount] =
        useState(0);

    const [electionCount, setElectionCount] =
        useState(0);

    const [error, setError] =
        useState("");


    async function loadBlockchainData() {

        try {

            setError("");

            const contract =
                await getContract();

            // admin() is a valid public variable
            const adminAddress =
                await contract.admin();

            setAdmin(adminAddress);

            // getNextElectionId() tells us how many elections exist
            // Elections are 1-indexed, so (nextId - 1) = total elections
            const nextId =
                await contract.getNextElectionId();

            const numElections = Number(nextId) - 1;
            setElectionCount(numElections);

            // Aggregate candidate counts and votes across all elections
            let totalCandidates = 0;
            let totalVotesSum = 0;

            for (let i = 1; i <= numElections; i++) {

                try {
                    const election =
                        await contract.getElection(i);

                    // getElection returns: (id, title, description, startTime, endTime, candidateCount, totalVotes)
                    totalCandidates += Number(election[5]);
                    totalVotesSum += Number(election[6]);

                } catch (e) {
                    // Election might not exist, skip
                    console.warn(`Could not load election ${i}:`, e);
                }
            }

            setCandidateCount(totalCandidates);
            setTotalVotes(totalVotesSum);

        } catch (error: any) {

            console.error(error);

            setError(
                error.message ||
                "Failed to read blockchain."
            );

        }
    }


    useEffect(() => {

        loadBlockchainData();

    }, []);


    return (
        <div>

            <h2>
                Blockchain Status
            </h2>

            <p>
                Admin:
                {" "}
                {admin}
            </p>

            <p>
                Elections:
                {" "}
                {electionCount}
            </p>

            <p>
                Candidates:
                {" "}
                {candidateCount}
            </p>

            <p>
                Total Votes:
                {" "}
                {totalVotes}
            </p>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

        </div>
    );
}

export default BlockchainStatus;