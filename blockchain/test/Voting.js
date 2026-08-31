import { expect } from "chai";
import { network } from "hardhat";

describe("VotingSystem", function () {

    let voting;
    let admin;
    let voter1;
    let voter2;
    let unauthorized;
    let ethersProvider;

    // ============================================================
    // BEFORE EACH
    // ============================================================

    beforeEach(async function () {

        const connection = await network.create();
        const { ethers } = connection;

        ethersProvider = ethers.provider;

        [admin, voter1, voter2, unauthorized] =
            await ethers.getSigners();

        const VotingSystem =
            await ethers.getContractFactory(
                "VotingSystem"
            );

        voting = await VotingSystem.deploy();
        await voting.waitForDeployment();
    });

    // ============================================================
    // HELPER: create election with valid timestamps
    // ============================================================

    async function createTestElection(title = "University Election") {

        const latestBlock =
            await ethersProvider.getBlock("latest");

        const startTime = latestBlock.timestamp + 100;
        const endTime = latestBlock.timestamp + 1000;

        await voting.createElection(
            title,
            "Test election",
            startTime,
            endTime
        );

        return { startTime, endTime };
    }

    async function fastForwardToStart(startTime) {

        await ethersProvider.send(
            "evm_setNextBlockTimestamp",
            [startTime]
        );

        await ethersProvider.send("evm_mine");
    }

    // Helper: expect a transaction to revert with a message
    async function expectRevert(promise, expectedMessage) {
        try {
            await promise;
            expect.fail("Expected transaction to revert");
        } catch (error) {
            const errorMsg = error.reason || error.message || "";
            expect(errorMsg).to.include(expectedMessage);
        }
    }

    // ============================================================
    // TEST 1 - ADMIN
    // ============================================================

    it("should set deployer as admin", async function () {

        expect(
            await voting.admin()
        ).to.equal(admin.address);
    });

    // ============================================================
    // TEST 2 - CREATE ELECTION
    // ============================================================

    it("should create an election", async function () {

        await createTestElection("University Election 2026");

        const election = await voting.getElection(1);

        expect(election.title)
            .to.equal("University Election 2026");

        expect(Number(election.candidateCount))
            .to.equal(0);

        expect(Number(election.totalVotes))
            .to.equal(0);
    });

    // ============================================================
    // TEST 3 - ADD CANDIDATE
    // ============================================================

    it("should add candidates", async function () {

        await createTestElection();

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
            await voting.getCandidate(1, 1);

        const candidate2 =
            await voting.getCandidate(1, 2);

        expect(candidate1.name)
            .to.equal("Alice");

        expect(candidate2.name)
            .to.equal("Bob");

        expect(Number(
            await voting.getCandidateCount(1)
        )).to.equal(2);
    });

    // ============================================================
    // TEST 4 - AUTHORIZE VOTER
    // ============================================================

    it("should authorize voters", async function () {

        await createTestElection();

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
    });

    // ============================================================
    // TEST 5 - UNAUTHORIZED CANNOT VOTE
    // ============================================================

    it("should reject unauthorized voters", async function () {

        const { startTime } =
            await createTestElection();

        await voting.addCandidate(
            1,
            "Alice",
            "Candidate"
        );

        await fastForwardToStart(startTime);

        await expectRevert(
            voting
                .connect(unauthorized)
                .castVote(1, 1),
            "Voter is not authorized"
        );
    });

    // ============================================================
    // TEST 6 - CAST VOTE
    // ============================================================

    it("should allow an authorized voter to vote", async function () {

        const { startTime } =
            await createTestElection();

        await voting.addCandidate(
            1,
            "Alice",
            "Candidate"
        );

        await voting.authorizeVoter(
            1,
            voter1.address
        );

        await fastForwardToStart(startTime);

        await voting
            .connect(voter1)
            .castVote(1, 1);

        const candidate =
            await voting.getCandidate(1, 1);

        expect(Number(candidate.voteCount))
            .to.equal(1);

        const election =
            await voting.getElection(1);

        expect(Number(election.totalVotes))
            .to.equal(1);

        expect(
            await voting.hasVoterVoted(
                1,
                voter1.address
            )
        ).to.equal(true);
    });

    // ============================================================
    // TEST 7 - PREVENT DOUBLE VOTE
    // ============================================================

    it("should prevent double voting", async function () {

        const { startTime } =
            await createTestElection();

        await voting.addCandidate(
            1,
            "Alice",
            "Candidate"
        );

        await voting.authorizeVoter(
            1,
            voter1.address
        );

        await fastForwardToStart(startTime);

        await voting
            .connect(voter1)
            .castVote(1, 1);

        await expectRevert(
            voting
                .connect(voter1)
                .castVote(1, 1),
            "Voter has already voted"
        );
    });

    // ============================================================
    // TEST 8 - NON ADMIN CANNOT CREATE
    // ============================================================

    it("should prevent non-admin from creating elections", async function () {

        const latestBlock =
            await ethersProvider.getBlock("latest");

        const startTime = latestBlock.timestamp + 100;
        const endTime = latestBlock.timestamp + 1000;

        await expectRevert(
            voting
                .connect(voter1)
                .createElection(
                    "Fake Election",
                    "Fake",
                    startTime,
                    endTime
                ),
            "Only admin can perform this action"
        );
    });

    // ============================================================
    // TEST 9 - ELECTION STATUS
    // ============================================================

    it("should return election status", async function () {

        await createTestElection();

        expect(
            await voting.getElectionStatus(1)
        ).to.equal("UPCOMING");
    });

    // ============================================================
    // TEST 10 - MULTIPLE VOTERS
    // ============================================================

    it("should count votes from multiple voters", async function () {

        const { startTime } =
            await createTestElection();

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

        await fastForwardToStart(startTime);

        await voting
            .connect(voter1)
            .castVote(1, 1);

        await voting
            .connect(voter2)
            .castVote(1, 2);

        const alice =
            await voting.getCandidate(1, 1);

        const bob =
            await voting.getCandidate(1, 2);

        expect(Number(alice.voteCount))
            .to.equal(1);

        expect(Number(bob.voteCount))
            .to.equal(1);

        const election =
            await voting.getElection(1);

        expect(Number(election.totalVotes))
            .to.equal(2);
    });

});