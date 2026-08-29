import {
    BrowserProvider,
    Contract
} from "ethers";

import {
    CONTRACT_ADDRESS,
    CONTRACT_ABI
} from "../contracts/VotingSystem";

export async function getProvider() {

    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed."
        );
    }

    const provider =
        new BrowserProvider(
            window.ethereum
        );

    return provider;
}


export async function connectWallet() {

    if (!window.ethereum) {
        throw new Error(
            "Please install MetaMask."
        );
    }

    const accounts =
        await window.ethereum.request({
            method: "eth_requestAccounts"
        });

    return accounts[0];
}


export async function getSigner() {

    const provider =
        await getProvider();

    return await provider.getSigner();
}


export async function getContract(
    withSigner = false
) {

    if (withSigner) {

        const signer =
            await getSigner();

        return new Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

    }

    const provider =
        await getProvider();

    return new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
    );
}