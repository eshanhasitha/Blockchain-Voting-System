import { BrowserProvider, Contract } from "ethers";
import VotingSystem from "./VotingSystem.json";

export const CONTRACT_ADDRESS =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI =
    VotingSystem.abi;

export async function getProvider() {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask");
    }

    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    });

    return accounts[0];
}

export async function getSigner() {
    const provider = await getProvider();

    return provider.getSigner();
}

export async function getContract(withSigner = false) {
    if (withSigner) {
        const signer = await getSigner();

        return new Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );
    }

    const provider = await getProvider();

    return new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
    );
}