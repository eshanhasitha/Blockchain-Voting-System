import { useState, useEffect } from "react";
import { connectWallet, formatMetaMaskError } from "../utils/blockchain";
import { HARDHAT_CHAIN_ID } from "../contracts/contractConfig";

interface WalletProps {
    onAddressChange?: (address: string) => void;
}

export default function Wallet({ onAddressChange }: WalletProps) {
    const [address, setAddress] = useState("");
    const [chainId, setChainId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const checkExistingConnection = async () => {
        if (!window.ethereum) return;

        try {
            const accounts = (await window.ethereum.request({
                method: "eth_accounts",
            })) as string[];

            if (accounts && accounts.length > 0) {
                const connectedAddr = accounts[0];
                setAddress(connectedAddr);
                onAddressChange?.(connectedAddr);

                const chainHex = (await window.ethereum.request({
                    method: "eth_chainId",
                })) as string;
                setChainId(parseInt(chainHex, 16));
            }
        } catch (err) {
            console.error("Error checking existing connection:", err);
        }
    };

    useEffect(() => {
        checkExistingConnection();

        if (window.ethereum) {
            const handleAccounts = (accounts: string[]) => {
                if (accounts.length === 0) {
                    setAddress("");
                    onAddressChange?.("");
                } else {
                    setAddress(accounts[0]);
                    onAddressChange?.(accounts[0]);
                }
            };

            const handleChain = (hex: string) => {
                setChainId(parseInt(hex, 16));
            };

            window.ethereum.on("accountsChanged", handleAccounts);
            window.ethereum.on("chainChanged", handleChain);

            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccounts);
                window.ethereum.removeListener("chainChanged", handleChain);
            };
        }
    }, [onAddressChange]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            setError("");

            const wallet = await connectWallet();
            setAddress(wallet.address);
            setChainId(wallet.chainId);
            onAddressChange?.(wallet.address);
        } catch (err: any) {
            console.error("Wallet connection error:", err);
            setError(formatMetaMaskError(err));
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        MetaMask Wallet
                    </h3>
                    {address ? (
                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="font-mono text-white text-sm break-all font-semibold">
                                {address}
                            </span>
                            <button
                                onClick={copyAddress}
                                title="Copy address"
                                className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded transition-colors"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mt-1">
                            No wallet connected. Connect MetaMask to interact with the voting system.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {address && chainId !== null && (
                        <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                                isCorrectNetwork
                                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                        >
                            {isCorrectNetwork ? "Hardhat (31337)" : `Chain ID ${chainId}`}
                        </span>
                    )}

                    {!address ? (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-all shadow-md shadow-blue-600/25"
                        >
                            {loading ? "Connecting..." : "Connect MetaMask"}
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Switch Account
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-3 p-3 bg-red-950/60 border border-red-800/50 rounded-lg text-red-300 text-xs">
                    {error}
                </div>
            )}
        </div>
    );
}
