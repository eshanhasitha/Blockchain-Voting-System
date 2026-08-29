import { useEffect, useState } from "react";

import {
    getContract
} from "../utils/contract";


function CandidateList() {

    const [candidates, setCandidates] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    async function loadCandidates() {

        try {

            const contract =
                await getContract();

            const count =
                await contract.candidateCount();

            const result = [];

            for (
                let i = 1;
                i <= Number(count);
                i++
            ) {

                const candidate =
                    await contract.candidates(i);

                result.push({
                    id: Number(candidate.id),
                    name: candidate.name,
                    description:
                        candidate.description,
                    voteCount:
                        Number(candidate.voteCount)
                });

            }

            setCandidates(result);

        } catch (error) {

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
                <p>{error}</p>
            )}

            {candidates.length === 0 ? (

                <p>
                    No candidates available.
                </p>

            ) : (

                candidates.map(
                    (candidate) => (

                        <div
                            key={candidate.id}
                        >

                            <h3>
                                {candidate.name}
                            </h3>

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