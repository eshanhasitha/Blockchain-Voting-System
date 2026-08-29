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

    const [electionCreated, setElectionCreated] =
        useState(false);

    const [error, setError] =
        useState("");


    async function loadBlockchainData() {

        try {

            setError("");

            const contract =
                await getContract();

            const adminAddress =
                await contract.admin();

            const votes =
                await contract.totalVotes();

            const candidates =
                await contract.candidateCount();

            const election =
                await contract.electionCreated();

            setAdmin(adminAddress);

            setTotalVotes(
                Number(votes)
            );

            setCandidateCount(
                Number(candidates)
            );

            setElectionCreated(
                election
            );

        } catch (error) {

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
                Candidates:
                {" "}
                {candidateCount}
            </p>

            <p>
                Total Votes:
                {" "}
                {totalVotes}
            </p>

            <p>
                Election Created:
                {" "}
                {electionCreated
                    ? "Yes"
                    : "No"
                }
            </p>

            {error && (
                <p>
                    {error}
                </p>
            )}

        </div>
    );
}

export default BlockchainStatus;