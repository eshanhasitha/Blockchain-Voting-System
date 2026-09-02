import { useEffect, useState } from "react";
import { HARDHAT_CHAIN_ID } from "../contracts/contractConfig";
import { switchToHardhatNetwork } from "../utils/blockchain";

export default function NetworkAlert() {
    const [currentChainId, setCurrentChainId] = useState<number | null>(null);
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState("");

    async function detectNetwork() {
        if (typeof window === "undefined" || !window.ethereum) return;

        try {
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
            const chainIdDec = parseInt(chainIdHex, 16);
            setCurrentChainId(chainIdDec);
        } catch (err: any) {
            console.error("Network detection error:", err);
        }
    }

    useEffect(() => {
        detectNetwork();

        if (typeof window !== "undefined" && window.ethereum) {
            const handleChainChanged = (chainIdHex: string) => {
                const chainIdDec = parseInt(chainIdHex, 16);
                setCurrentChainId(chainIdDec);
            };

            window.ethereum.on("chainChanged", handleChainChanged);

            return () => {
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            };
        }
    }, []);

    const handleSwitch = async () => {
        try {
            setSwitching(true);
            setError("");
            await switchToHardhatNetwork();
            await detectNetwork();
        } catch (err: any) {
            console.error("Failed to switch network:", err);
            setError(err.message || "Could not switch to Hardhat network.");
        } finally {
            setSwitching(false);
        }
    };

    if (currentChainId === null || currentChainId === HARDHAT_CHAIN_ID) {
        return null;
    }

    return (
        <div className="bg-amber-950/80 border-b border-amber-600/50 text-amber-200 px-6 py-3">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>
                        <strong>Wrong Network Detected:</strong> You are currently on Chain ID{" "}
                        <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-xs">
                            {currentChainId}
                        </code>
                        . Please connect to <strong>Hardhat Local</strong> (Chain ID{" "}
                        <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-xs">
                            {HARDHAT_CHAIN_ID}
                        </code>
                        ) to interact with the smart contract.
                    </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleSwitch}
                        disabled={switching}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 shadow-sm"
                    >
                        {switching ? "Switching..." : "Switch to Hardhat Local"}
                    </button>
                </div>
            </div>
            {error && (
                <div className="max-w-6xl mx-auto text-xs text-red-400 mt-1 pl-6">
                    {error}
                </div>
            )}
        </div>
    );
}
