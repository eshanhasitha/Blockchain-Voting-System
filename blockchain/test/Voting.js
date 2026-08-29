import { expect } from "chai";
import hre from "hardhat";

describe("VotingSystem", function () {

    let voting;

    let admin;
    let voter1;
    let voter2;
    let unauthorized;


    // ============================================================
    // BEFORE EACH
    // ============================================================

    beforeEach(async function () {

        [
            admin,
            voter1,
            voter2,
            unauthorized
        ] = await hre.ethers.getSigners();


        const VotingSystem =
            await hre.ethers.getContractFactory(
                "VotingSystem"
            );


        voting =
            await VotingSystem.deploy();


        await voting.waitForDeployment();
    });


    // ============================================================
    // TEST 1 - ADMIN
    // ============================================================

    it(
        "should set deployer as admin",
        async function () {

            expect(
                await voting.admin()
            ).to.equal(admin.address);

        }
    );


    // ============================================================
    // TEST 2 - CREATE ELECTION
    // ============================================================

    it(
        "should create an election",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 100;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election 2026",
                "Student council election",
                startTime,
                endTime
            );


            const election =
                await voting.getElection(1);


            expect(election.title)
                .to.equal(
                    "University Election 2026"
                );


            expect(election.description)
                .to.equal(
                    "Student council election"
                );


            expect(election.candidateCount)
                .to.equal(0);


            expect(election.totalVotes)
                .to.equal(0);
        }
    );


    // ============================================================
    // TEST 3 - ADD CANDIDATE
    // ============================================================

    it(
        "should add candidates",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 100;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.addCandidate(
                1,
                "Alice",
                "Computer Science Student"
            );


            await voting.addCandidate(
                1,
                "Bob",
                "Information Systems Student"
            );


            const candidate1 =
                await voting.getCandidate(
                    1,
                    1
                );


            const candidate2 =
                await voting.getCandidate(
                    1,
                    2
                );


            expect(candidate1.name)
                .to.equal("Alice");


            expect(candidate2.name)
                .to.equal("Bob");


            expect(
                await voting.getCandidateCount(1)
            ).to.equal(2);
        }
    );


    // ============================================================
    // TEST 4 - AUTHORIZE VOTER
    // ============================================================

    it(
        "should authorize voters",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 100;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.authorizeVoter(
                1,
                voter1.address
            );


            expect(
                await voting.isAuthorizedVoter(
                    1,
                    voter1.address
                )
            ).to.equal(true);
        }
    );


    // ============================================================
    // TEST 5 - UNAUTHORIZED USER CANNOT VOTE
    // ============================================================

    it(
        "should reject unauthorized voters",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 10;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.addCandidate(
                1,
                "Alice",
                "Candidate"
            );


            await hre.ethers.provider.send(
                "evm_setNextBlockTimestamp",
                [startTime]
            );


            await hre.ethers.provider.send(
                "evm_mine"
            );


            await expect(
                voting
                    .connect(unauthorized)
                    .castVote(1, 1)
            ).to.be.revertedWith(
                "Voter is not authorized"
            );
        }
    );


    // ============================================================
    // TEST 6 - CAST VOTE
    // ============================================================

    it(
        "should allow an authorized voter to vote",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 10;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.addCandidate(
                1,
                "Alice",
                "Candidate"
            );


            await voting.authorizeVoter(
                1,
                voter1.address
            );


            await hre.ethers.provider.send(
                "evm_setNextBlockTimestamp",
                [startTime]
            );


            await hre.ethers.provider.send(
                "evm_mine"
            );


            await voting
                .connect(voter1)
                .castVote(1, 1);


            const candidate =
                await voting.getCandidate(
                    1,
                    1
                );


            expect(candidate.voteCount)
                .to.equal(1);


            const election =
                await voting.getElection(1);


            expect(election.totalVotes)
                .to.equal(1);


            expect(
                await voting.hasVoterVoted(
                    1,
                    voter1.address
                )
            ).to.equal(true);
        }
    );


    // ============================================================
    // TEST 7 - PREVENT DOUBLE VOTE
    // ============================================================

    it(
        "should prevent double voting",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 10;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.addCandidate(
                1,
                "Alice",
                "Candidate"
            );


            await voting.authorizeVoter(
                1,
                voter1.address
            );


            await hre.ethers.provider.send(
                "evm_setNextBlockTimestamp",
                [startTime]
            );


            await hre.ethers.provider.send(
                "evm_mine"
            );


            await voting
                .connect(voter1)
                .castVote(1, 1);


            await expect(
                voting
                    .connect(voter1)
                    .castVote(1, 1)
            ).to.be.revertedWith(
                "Voter has already voted"
            );
        }
    );


    // ============================================================
    // TEST 8 - NON ADMIN CANNOT CREATE
    // ============================================================

    it(
        "should prevent non-admin from creating elections",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 100;


            const endTime =
                latestBlock.timestamp + 1000;


            await expect(
                voting
                    .connect(voter1)
                    .createElection(
                        "Fake Election",
                        "Fake",
                        startTime,
                        endTime
                    )
            ).to.be.revertedWith(
                "Only admin can perform this action"
            );
        }
    );


    // ============================================================
    // TEST 9 - ELECTION STATUS
    // ============================================================

    it(
        "should return election status",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 100;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            expect(
                await voting.getElectionStatus(1)
            ).to.equal("UPCOMING");
        }
    );


    // ============================================================
    // TEST 10 - MULTIPLE VOTERS
    // ============================================================

    it(
        "should count votes from multiple voters",
        async function () {

            const latestBlock =
                await hre.ethers.provider.getBlock(
                    "latest"
                );


            const startTime =
                latestBlock.timestamp + 10;


            const endTime =
                latestBlock.timestamp + 1000;


            await voting.createElection(
                "University Election",
                "Election",
                startTime,
                endTime
            );


            await voting.addCandidate(
                1,
                "Alice",
                "Candidate"
            );


            await voting.addCandidate(
                1,
                "Bob",
                "Candidate"
            );


            await voting.authorizeVoter(
                1,
                voter1.address
            );


            await voting.authorizeVoter(
                1,
                voter2.address
            );


            await hre.ethers.provider.send(
                "evm_setNextBlockTimestamp",
                [startTime]
            );


            await hre.ethers.provider.send(
                "evm_mine"
            );


            await voting
                .connect(voter1)
                .castVote(1, 1);


            await voting
                .connect(voter2)
                .castVote(1, 2);


            const alice =
                await voting.getCandidate(
                    1,
                    1
                );


            const bob =
                await voting.getCandidate(
                    1,
                    2
                );


            expect(alice.voteCount)
                .to.equal(1);


            expect(bob.voteCount)
                .to.equal(1);


            const election =
                await voting.getElection(1);


            expect(election.totalVotes)
                .to.equal(2);
        }
    );

});