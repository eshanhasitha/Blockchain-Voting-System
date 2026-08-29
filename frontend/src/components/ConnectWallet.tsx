import { useState } from "react";

import {
    connectWallet
} from "../utils/contract";

function ConnectWallet() {

    const [account, setAccount] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    async function handleConnect() {

        try {

            setLoading(true);
            setError("");

            const address =
                await connectWallet();

            setAccount(address);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Failed to connect wallet."
            );

        } finally {

            setLoading(false);

        }
    }


    function shortenAddress(address) {

        if (!address) return "";

        return (
            address.slice(0, 6) +
            "..." +
            address.slice(-4)
        );
    }


    return (
        <div>

            {!account ? (

                <button
                    onClick={handleConnect}
                    disabled={loading}
                >
                    {loading
                        ? "Connecting..."
                        : "Connect MetaMask"
                    }
                </button>

            ) : (

                <div>

                    <p>
                        Wallet Connected
                    </p>

                    <p>
                        {shortenAddress(account)}
                    </p>

                </div>

            )}

            {error && (
                <p>
                    {error}
                </p>
            )}

        </div>
    );
}

export default ConnectWallet;