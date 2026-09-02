import { BrowserProvider, Contract, type JsonRpcSigner } from "ethers";
import VotingSystem from "../contracts/VotingSystem.json";
import {
    CONTRACT_ADDRESS,
    HARDHAT_CHAIN_ID,
    HARDHAT_CHAIN_ID_HEX,
    HARDHAT_NETWORK_CONFIG,
} from "../contracts/contractConfig";

export interface WalletConnection {
    provider: BrowserProvider;
    signer: JsonRpcSigner;
    address: string;
    chainId: number;
}

export async function getProvider(): Promise<BrowserProvider> {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }
    return new BrowserProvider(window.ethereum);
}

export async function connectWallet(): Promise<WalletConnection> {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask.");
    }

    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
        provider,
        signer,
        address,
        chainId,
    };
}

export async function checkNetwork(): Promise<{ isCorrect: boolean; currentChainId: number }> {
    if (!window.ethereum) {
        return { isCorrect: false, currentChainId: 0 };
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    return {
        isCorrect: currentChainId === HARDHAT_CHAIN_ID,
        currentChainId,
    };
}

export async function switchToHardhatNetwork(): Promise<void> {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
    }

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [HARDHAT_NETWORK_CONFIG],
            });
        } else {
            throw switchError;
        }
    }
}

export async function getVotingContract(withSigner: boolean = true): Promise<Contract> {
    const provider = await getProvider();

    if (withSigner) {
        const signer = await provider.getSigner();
        return new Contract(CONTRACT_ADDRESS, VotingSystem.abi, signer);
    }

    return new Contract(CONTRACT_ADDRESS, VotingSystem.abi, provider);
}

export function formatMetaMaskError(error: any): string {
    if (!error) return "An unknown error occurred.";

    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        return "Transaction rejected by user in MetaMask.";
    }

    if (error.code === -32002) {
        return "MetaMask request already pending. Please check MetaMask popup.";
    }

    if (error.reason) {
        return error.reason;
    }

    if (error.shortMessage) {
        return error.shortMessage;
    }

    if (error.message) {
        if (error.message.includes("user rejected")) {
            return "Transaction rejected by user.";
        }
        if (error.message.includes("Voter has already voted")) {
            return "Double voting rejected: You have already cast your vote in this election.";
        }
        if (error.message.includes("Voter is not authorized")) {
            return "Unauthorized: Your wallet address is not authorized for this election.";
        }
        if (error.message.includes("Election has not started")) {
            return "Election has not started yet.";
        }
        if (error.message.includes("Election has ended")) {
            return "Election has already ended.";
        }
        return error.message;
    }

    return "Transaction failed.";
}
