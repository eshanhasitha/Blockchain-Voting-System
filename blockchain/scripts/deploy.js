import hre from "hardhat";

async function main() {
    console.log("Deploying VotingSystem...");

    const { ethers } = await hre.network.connect();

    const [deployer] = await ethers.getSigners();

    console.log("Deploying from:", deployer.address);

    const VotingSystem =
        await ethers.getContractFactory("VotingSystem");

    const votingSystem =
        await VotingSystem.deploy();

    await votingSystem.waitForDeployment();

    const contractAddress =
        await votingSystem.getAddress();

    console.log(
        "VotingSystem deployed to:",
        contractAddress
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});