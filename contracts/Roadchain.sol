// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RoadChain
 * @notice MVP smart contract for blockchain-based road infrastructure governance.
 * @dev Built for a 2-day student hackathon. Keeps logic intentionally simple:
 *      - No ZKP, no IPFS, no oracles, no off-chain notifications.
 *      - Only minimal on-chain data is stored (no personal citizen info).
 */
contract RoadChain {
    // ---------------------------------------------------------------------
    // ACCESS CONTROL
    // ---------------------------------------------------------------------

    /// @notice Contract deployer, treated as the government/admin authority.
    address public government;

    /// @notice Addresses authorized to act as inspectors.
    mapping(address => bool) public isInspector;

    modifier onlyGovernment() {
        require(msg.sender == government, "Only government can perform this action");
        _;
    }

    modifier onlyInspector() {
        require(isInspector[msg.sender], "Only an authorized inspector can perform this action");
        _;
    }

    modifier onlyContractor(uint256 roadId) {
        require(msg.sender == roads[roadId].contractor, "Only the assigned contractor can perform this action");
        _;
    }

    constructor() {
        government = msg.sender;
    }

    // ---------------------------------------------------------------------
    // DATA STRUCTURES
    // ---------------------------------------------------------------------

    enum ComplaintStatus { Submitted, UnderWarrantyCase, Resolved, Rejected }
    enum RepairStatus { None, Pending, Completed, Verified }

    struct Road {
        uint256 roadId;
        address contractor;
        uint256 completionDate;   // unix timestamp
        uint256 warrantyPeriod;   // duration in seconds
        bool exists;
    }

    struct Complaint {
        uint256 complaintId;
        uint256 roadId;
        string issueCategory;     // short category/description, no personal data
        uint256 timestamp;
        ComplaintStatus status;
    }

    struct RepairCase {
        uint256 complaintId;
        uint256 roadId;
        uint256 deadline;         // repair must be completed by this timestamp
        RepairStatus status;
        bool inspectorVerified;
    }

    // ---------------------------------------------------------------------
    // STORAGE
    // ---------------------------------------------------------------------

    mapping(uint256 => Road) public roads;
    mapping(uint256 => Complaint) public complaints;
    mapping(uint256 => RepairCase) public repairCases; // keyed by complaintId
    mapping(address => uint256) public trustScore;      // contractor => score (0-100)

    uint256 public nextComplaintId = 1;

    // Simple MVP constant: contractors get X days to fix a warranty defect.
    uint256 public constant REPAIR_WINDOW = 14 days;

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    event RoadRegistered(uint256 indexed roadId, address indexed contractor, uint256 completionDate, uint256 warrantyExpiry);
    event ComplaintSubmitted(uint256 indexed complaintId, uint256 indexed roadId, string issueCategory, uint256 timestamp);
    event WarrantyCaseCreated(uint256 indexed complaintId, uint256 indexed roadId, uint256 deadline);
    event RepairCompleted(uint256 indexed complaintId, uint256 indexed roadId, uint256 timestamp);
    event InspectionVerified(uint256 indexed complaintId, uint256 indexed roadId, bool passed, address inspector);
    event TrustScoreUpdated(address indexed contractor, uint256 newScore, string reason);
    event InspectorAdded(address indexed inspector);
    event InspectorRemoved(address indexed inspector);

    // ---------------------------------------------------------------------
    // ADMIN: INSPECTOR MANAGEMENT
    // ---------------------------------------------------------------------

    function addInspector(address inspector) external onlyGovernment {
        isInspector[inspector] = true;
        emit InspectorAdded(inspector);
    }

    function removeInspector(address inspector) external onlyGovernment {
        isInspector[inspector] = false;
        emit InspectorRemoved(inspector);
    }

    // ---------------------------------------------------------------------
    // 1. ROAD REGISTRATION
    // ---------------------------------------------------------------------

    /**
     * @notice Registers a new road and its contractor. Only government can register roads.
     * @param roadId Unique identifier for the road.
     * @param contractor Address of the contractor responsible for the road.
     * @param completionDate Unix timestamp when construction was completed.
     * @param warrantyPeriod Warranty duration in seconds (e.g. 365 days).
     */
    function registerRoad(
        uint256 roadId,
        address contractor,
        uint256 completionDate,
        uint256 warrantyPeriod
    ) external onlyGovernment {
        require(!roads[roadId].exists, "Road already registered");
        require(contractor != address(0), "Invalid contractor address");

        roads[roadId] = Road({
            roadId: roadId,
            contractor: contractor,
            completionDate: completionDate,
            warrantyPeriod: warrantyPeriod,
            exists: true
        });

        // Initialize contractor trust score if this is their first road.
        if (trustScore[contractor] == 0) {
            trustScore[contractor] = 70; // neutral starting score for MVP
        }

        emit RoadRegistered(roadId, contractor, completionDate, completionDate + warrantyPeriod);
    }

    // ---------------------------------------------------------------------
    // 3. WARRANTY CHECKING
    // ---------------------------------------------------------------------

    /**
     * @notice Determines whether a road is currently under warranty.
     */
    function isUnderWarranty(uint256 roadId) public view returns (bool) {
        Road memory r = roads[roadId];
        require(r.exists, "Road does not exist");
        return block.timestamp <= (r.completionDate + r.warrantyPeriod);
    }

    function warrantyExpiry(uint256 roadId) external view returns (uint256) {
        Road memory r = roads[roadId];
        require(r.exists, "Road does not exist");
        return r.completionDate + r.warrantyPeriod;
    }

    // ---------------------------------------------------------------------
    // 2 & 4. CITIZEN COMPLAINT + WARRANTY REPAIR CASE
    // ---------------------------------------------------------------------

    /**
     * @notice Any citizen can submit a complaint about a registered road.
     *         No personal identifying info is stored - only the caller's address
     *         is implicitly linked via msg.sender in the emitted event/tx, not stored in struct.
     * @param roadId The road being complained about.
     * @param issueCategory Short description/category of the issue (e.g. "Pothole").
     */
    function submitComplaint(uint256 roadId, string calldata issueCategory) external {
        require(roads[roadId].exists, "Road does not exist");

        uint256 complaintId = nextComplaintId++;

        complaints[complaintId] = Complaint({
            complaintId: complaintId,
            roadId: roadId,
            issueCategory: issueCategory,
            timestamp: block.timestamp,
            status: ComplaintStatus.Submitted
        });

        emit ComplaintSubmitted(complaintId, roadId, issueCategory, block.timestamp);

        // If the road is still under warranty, automatically open a repair case.
        if (isUnderWarranty(roadId)) {
            complaints[complaintId].status = ComplaintStatus.UnderWarrantyCase;

            uint256 deadline = block.timestamp + REPAIR_WINDOW;
            repairCases[complaintId] = RepairCase({
                complaintId: complaintId,
                roadId: roadId,
                deadline: deadline,
                status: RepairStatus.Pending,
                inspectorVerified: false
            });

            emit WarrantyCaseCreated(complaintId, roadId, deadline);
        }
    }

    // ---------------------------------------------------------------------
    // 5. REPAIR COMPLETION
    // ---------------------------------------------------------------------

    /**
     * @notice Contractor marks a warranty repair case as completed.
     */
    function markRepairCompleted(uint256 complaintId) external {
        RepairCase storage rc = repairCases[complaintId];
        require(rc.status == RepairStatus.Pending, "No pending repair case for this complaint");
        require(msg.sender == roads[rc.roadId].contractor, "Only the assigned contractor can complete this repair");

        rc.status = RepairStatus.Completed;
        emit RepairCompleted(complaintId, rc.roadId, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // 6. INSPECTOR VERIFICATION
    // ---------------------------------------------------------------------

    /**
     * @notice Inspector verifies whether a completed repair actually passed inspection.
     *         This also triggers a trust score update for the contractor (part 7).
     * @param complaintId The complaint/repair case being verified.
     * @param passed True if inspector confirms the repair meets standards.
     */
    function verifyRepair(uint256 complaintId, bool passed) external onlyInspector {
        RepairCase storage rc = repairCases[complaintId];
        require(rc.status == RepairStatus.Completed, "Repair must be marked completed before verification");

        address contractor = roads[rc.roadId].contractor;

        if (passed) {
            rc.status = RepairStatus.Verified;
            rc.inspectorVerified = true;
            complaints[complaintId].status = ComplaintStatus.Resolved;
            _updateTrustScore(contractor, true, false);
        } else {
            // Failed inspection: keep case open as rejected, no fix credited.
            complaints[complaintId].status = ComplaintStatus.Rejected;
            _updateTrustScore(contractor, false, false);
        }

        emit InspectionVerified(complaintId, rc.roadId, passed, msg.sender);
    }

    /**
     * @notice Anyone can call this to flag a missed repair deadline as a warranty
     *         violation, which penalizes the contractor's trust score.
     *         Kept simple and permissionless for MVP purposes.
     */
    function flagMissedDeadline(uint256 complaintId) external {
        RepairCase storage rc = repairCases[complaintId];
        require(rc.status == RepairStatus.Pending, "Repair case is not pending");
        require(block.timestamp > rc.deadline, "Deadline has not passed yet");

        address contractor = roads[rc.roadId].contractor;
        _updateTrustScore(contractor, false, true);
    }

    // ---------------------------------------------------------------------
    // 7. CONTRACTOR TRUST SCORE
    // ---------------------------------------------------------------------

    /**
     * @dev Internal simple scoring logic for MVP:
     *      - Successful, verified repair: +5 points
     *      - Failed inspection: -10 points
     *      - Missed warranty deadline: -15 points
     *      Score is clamped between 0 and 100.
     */
    function _updateTrustScore(address contractor, bool repairSucceeded, bool missedDeadline) internal {
        uint256 score = trustScore[contractor];
        string memory reason;

        if (missedDeadline) {
            score = score >= 15 ? score - 15 : 0;
            reason = "Missed warranty repair deadline";
        } else if (repairSucceeded) {
            score = score + 5 > 100 ? 100 : score + 5;
            reason = "Successful verified repair";
        } else {
            score = score >= 10 ? score - 10 : 0;
            reason = "Failed inspection";
        }

        trustScore[contractor] = score;
        emit TrustScoreUpdated(contractor, score, reason);
    }

    // ---------------------------------------------------------------------
    // VIEW HELPERS
    // ---------------------------------------------------------------------

    function getRoad(uint256 roadId) external view returns (Road memory) {
        return roads[roadId];
    }

    function getComplaint(uint256 complaintId) external view returns (Complaint memory) {
        return complaints[complaintId];
    }

    function getRepairCase(uint256 complaintId) external view returns (RepairCase memory) {
        return repairCases[complaintId];
    }
}
