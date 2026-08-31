import { useState } from "react";
import { getContract } from "../utils/contract";

export default function Admin() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [message, setMessage] = useState("");

    async function createElection() {
        try {
            setMessage("Creating election...");

            if (!title) {
                setMessage("Title is required.");
                return;
            }

            if (!startTime || !endTime) {
                setMessage(
                    "Start time and end time are required."
                );
                return;
            }

            const startTimestamp = Math.floor(
                new Date(startTime).getTime() / 1000
            );

            const endTimestamp = Math.floor(
                new Date(endTime).getTime() / 1000
            );

            if (startTimestamp <= Math.floor(Date.now() / 1000)) {
                setMessage(
                    "Start time must be in the future."
                );
                return;
            }

            if (endTimestamp <= startTimestamp) {
                setMessage(
                    "End time must be after start time."
                );
                return;
            }

            const contract = await getContract(true);

            const tx = await contract.createElection(
                title,
                description,
                startTimestamp,
                endTimestamp
            );

            await tx.wait();

            setMessage("Election created successfully!");

            setTitle("");
            setDescription("");
            setStartTime("");
            setEndTime("");
        } catch (error) {
            console.error(error);

            setMessage(
                error.reason ||
                error.shortMessage ||
                "Failed to create election"
            );
        }
    }

    return (
        <div>
            <h1>Admin Dashboard</h1>

            <input
                type="text"
                placeholder="Election title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) =>
                    setDescription(e.target.value)
                }
            />

            <label>
                Start Time
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) =>
                        setStartTime(e.target.value)
                    }
                />
            </label>

            <label>
                End Time
                <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) =>
                        setEndTime(e.target.value)
                    }
                />
            </label>

            <button onClick={createElection}>
                Create Election
            </button>

            <p>{message}</p>
        </div>
    );
}