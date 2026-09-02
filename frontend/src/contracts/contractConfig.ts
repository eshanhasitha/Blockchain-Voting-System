export const CONTRACT_ADDRESS: string =
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_NETWORK: string = "localhost";

export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_CHAIN_ID_HEX = "0x7a69";

export const HARDHAT_NETWORK_CONFIG = {
    chainId: HARDHAT_CHAIN_ID_HEX,
    chainName: "Hardhat Local",
    nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: ["http://127.0.0.1:8545"],
};
