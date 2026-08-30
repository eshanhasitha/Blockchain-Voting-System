import { useEffect, useState } from "react";

import {
    getContract
} from "../utils/contract";


interface CandidateData {
    electionId: number;
    id: number;
    name: string;
    description: string;
    voteCount: number;
}


function CandidateList() {

    const [candidates, setCandidates] =
        useState<CandidateData[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    async function loadCandidates() {

        try {

            const contract =
                await getContract();

            // Get total number of elections
            const nextId =
                await contract.getNextElectionId();

            const numElections = Number(nextId) - 1;

            const result: CandidateData[] = [];

            for (let electionId = 1; electionId <= numElections; electionId++) {

                try {
                    // getCandidateCount(electionId) returns the number of candidates
                    const count =
                        await contract.getCandidateCount(electionId);

                    for (
                        let candidateId = 1;
                        candidateId <= Number(count);
                        candidateId++
                    ) {

                        try {
                            // getCandidate(electionId, candidateId) returns (id, name, description, voteCount)
                            const candidate =
                                await contract.getCandidate(electionId, candidateId);

                            result.push({
                                electionId,
                                id: Number(candidate[0]),
                                name: candidate[1],
                                description: candidate[2],
                                voteCount: Number(candidate[3])
                            });

                        } catch (e) {
                            console.warn(
                                `Could not load candidate ${candidateId} from election ${electionId}:`, e
                            );
                        }
                    }

                } catch (e) {
                    console.warn(
                        `Could not load candidates for election ${electionId}:`, e
                    );
                }
            }

            setCandidates(result);

        } catch (error: any) {

            console.error(error);

            setError(
                error.message
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        loadCandidates();

    }, []);


    if (loading) {

        return (
            <p>
                Loading candidates...
            </p>
        );

    }


    return (
        <div>

            <h2>
                Candidates
            </h2>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            {candidates.length === 0 ? (

                <p>
                    No candidates available.
                </p>

            ) : (

                candidates.map(
                    (candidate) => (

                        <div
                            key={`${candidate.electionId}-${candidate.id}`}
                        >

                            <h3>
                                {candidate.name}
                            </h3>

                            <p>
                                Election #{candidate.electionId}
                            </p>

                            <p>
                                {candidate.description}
                            </p>

                            <p>
                                Votes:
                                {" "}
                                {candidate.voteCount}
                            </p>

                        </div>

                    )
                )

            )}

        </div>
    );
}

export default CandidateList;