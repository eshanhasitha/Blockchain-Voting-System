// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract VotingSystem {

    // ============================================================
    // STATE VARIABLES
    // ============================================================

    address public admin;

    uint256 private nextElectionId = 1;


    // ============================================================
    // STRUCTS
    // ============================================================

    struct Election {

        uint256 id;

        string title;

        string description;

        uint256 startTime;

        uint256 endTime;

        bool exists;

        uint256 candidateCount;

        uint256 totalVotes;
    }


    struct Candidate {

        uint256 id;

        string name;

        string description;

        uint256 voteCount;

        bool exists;
    }


    // ============================================================
    // MAPPINGS
    // ============================================================

    mapping(
        uint256 => Election
    ) public elections;


    /*
     * electionId
     *      ↓
     * candidateId
     *      ↓
     * Candidate
     */
    mapping(
        uint256 => mapping(uint256 => Candidate)
    ) public candidates;


    /*
     * electionId
     *      ↓
     * voter address
     *      ↓
     * true / false
     */
    mapping(
        uint256 => mapping(address => bool)
    ) public authorizedVoters;


    /*
     * electionId
     *      ↓
     * voter address
     *      ↓
     * true / false
     */
    mapping(
        uint256 => mapping(address => bool)
    ) public hasVoted;


    // ============================================================
    // EVENTS
    // ============================================================

    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime
    );


    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name
    );


    event VoterAuthorized(
        uint256 indexed electionId,
        address indexed voter
    );


    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address indexed voter
    );


    event ElectionClosed(
        uint256 indexed electionId
    );


    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyAdmin() {

        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );

        _;
    }


    modifier electionExists(
        uint256 electionId
    ) {

        require(
            elections[electionId].exists,
            "Election does not exist"
        );

        _;
    }


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {

        admin = msg.sender;
    }


    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    function createElection(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime
    )
        external
        onlyAdmin
        returns (uint256)
    {

        require(
            bytes(title).length > 0,
            "Title cannot be empty"
        );


        require(
            startTime > block.timestamp,
            "Start time must be in the future"
        );


        require(
            endTime > startTime,
            "End time must be after start time"
        );


        uint256 electionId = nextElectionId;


        elections[electionId] = Election({

            id: electionId,

            title: title,

            description: description,

            startTime: startTime,

            endTime: endTime,

            exists: true,

            candidateCount: 0,

            totalVotes: 0
        });


        nextElectionId++;


        emit ElectionCreated(
            electionId,
            title,
            startTime,
            endTime
        );


        return electionId;
    }


    // ============================================================
    // ADD CANDIDATE
    // ============================================================

    function addCandidate(
        uint256 electionId,
        string memory name,
        string memory description
    )
        external
        onlyAdmin
        electionExists(electionId)
    {

        Election storage election =
            elections[electionId];


        require(
            block.timestamp < election.startTime,
            "Election has already started"
        );


        require(
            bytes(name).length > 0,
            "Candidate name cannot be empty"
        );


        uint256 candidateId =
            election.candidateCount + 1;


        candidates[electionId][candidateId] =
            Candidate({

                id: candidateId,

                name: name,

                description: description,

                voteCount: 0,

                exists: true
            });


        election.candidateCount++;


        emit CandidateAdded(
            electionId,
            candidateId,
            name
        );
    }


    // ============================================================
    // AUTHORIZE VOTER
    // ============================================================

    function authorizeVoter(
        uint256 electionId,
        address voter
    )
        external
        onlyAdmin
        electionExists(electionId)
    {

        require(
            voter != address(0),
            "Invalid voter address"
        );


        require(
            !authorizedVoters[electionId][voter],
            "Voter already authorized"
        );


        require(
            block.timestamp <
            elections[electionId].startTime,
            "Election has already started"
        );


        authorizedVoters[electionId][voter] = true;


        emit VoterAuthorized(
            electionId,
            voter
        );
    }


    // ============================================================
    // AUTHORIZE MULTIPLE VOTERS
    // ============================================================

    function authorizeVoters(
        uint256 electionId,
        address[] calldata voters
    )
        external
        onlyAdmin
        electionExists(electionId)
    {

        require(
            block.timestamp <
            elections[electionId].startTime,
            "Election has already started"
        );


        for (
            uint256 i = 0;
            i < voters.length;
            i++
        ) {

            address voter = voters[i];


            require(
                voter != address(0),
                "Invalid voter address"
            );


            if (
                !authorizedVoters[electionId][voter]
            ) {

                authorizedVoters[electionId][voter] =
                    true;


                emit VoterAuthorized(
                    electionId,
                    voter
                );
            }
        }
    }


    // ============================================================
    // VOTE
    // ============================================================

    function castVote(
        uint256 electionId,
        uint256 candidateId
    )
        external
        electionExists(electionId)
    {

        Election storage election =
            elections[electionId];


        // ----------------------------------------
        // Check election has started
        // ----------------------------------------

        require(
            block.timestamp >= election.startTime,
            "Election has not started"
        );


        // ----------------------------------------
        // Check election has not ended
        // ----------------------------------------

        require(
            block.timestamp <= election.endTime,
            "Election has ended"
        );


        // ----------------------------------------
        // Check voter authorization
        // ----------------------------------------

        require(
            authorizedVoters[electionId][msg.sender],
            "Voter is not authorized"
        );


        // ----------------------------------------
        // Check voter hasn't already voted
        // ----------------------------------------

        require(
            !hasVoted[electionId][msg.sender],
            "Voter has already voted"
        );


        // ----------------------------------------
        // Check candidate
        // ----------------------------------------

        require(
            candidates[electionId][candidateId].exists,
            "Candidate does not exist"
        );


        // ----------------------------------------
        // Record vote
        // ----------------------------------------

        hasVoted[electionId][msg.sender] = true;


        candidates[electionId][candidateId]
            .voteCount++;


        election.totalVotes++;


        // ----------------------------------------
        // Emit blockchain event
        // ----------------------------------------

        emit VoteCast(
            electionId,
            candidateId,
            msg.sender
        );
    }


    // ============================================================
    // GET ELECTION
    // ============================================================

    function getElection(
        uint256 electionId
    )
        external
        view
        electionExists(electionId)
        returns (
            uint256 id,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 candidateCount,
            uint256 totalVotes
        )
    {

        Election memory election =
            elections[electionId];


        return (

            election.id,

            election.title,

            election.description,

            election.startTime,

            election.endTime,

            election.candidateCount,

            election.totalVotes
        );
    }


    // ============================================================
    // GET CANDIDATE
    // ============================================================

    function getCandidate(
        uint256 electionId,
        uint256 candidateId
    )
        external
        view
        electionExists(electionId)
        returns (
            uint256 id,
            string memory name,
            string memory description,
            uint256 voteCount
        )
    {

        Candidate memory candidate =
            candidates[electionId][candidateId];


        require(
            candidate.exists,
            "Candidate does not exist"
        );


        return (

            candidate.id,

            candidate.name,

            candidate.description,

            candidate.voteCount
        );
    }


    // ============================================================
    // GET CANDIDATE COUNT
    // ============================================================

    function getCandidateCount(
        uint256 electionId
    )
        external
        view
        electionExists(electionId)
        returns (uint256)
    {

        return elections[electionId].candidateCount;
    }


    // ============================================================
    // GET NEXT ELECTION ID
    // ============================================================

    function getNextElectionId()
        external
        view
        returns (uint256)
    {

        return nextElectionId;
    }


    // ============================================================
    // CHECK VOTER STATUS
    // ============================================================

    function isAuthorizedVoter(
        uint256 electionId,
        address voter
    )
        external
        view
        returns (bool)
    {

        return authorizedVoters[
            electionId
        ][voter];
    }


    function hasVoterVoted(
        uint256 electionId,
        address voter
    )
        external
        view
        returns (bool)
    {

        return hasVoted[
            electionId
        ][voter];
    }


    // ============================================================
    // ELECTION STATUS
    // ============================================================

    function getElectionStatus(
        uint256 electionId
    )
        external
        view
        electionExists(electionId)
        returns (string memory)
    {

        Election memory election =
            elections[electionId];


        if (
            block.timestamp <
            election.startTime
        ) {

            return "UPCOMING";
        }


        if (
            block.timestamp >
            election.endTime
        ) {

            return "ENDED";
        }


        return "ACTIVE";
    }


    // ============================================================
    // TRANSFER ADMIN
    // ============================================================

    function transferAdmin(
        address newAdmin
    )
        external
        onlyAdmin
    {

        require(
            newAdmin != address(0),
            "Invalid admin address"
        );


        admin = newAdmin;
    }
}