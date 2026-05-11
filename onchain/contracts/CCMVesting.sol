// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM Vesting
 * @notice Linear vesting with cliff. Separate schedules can be created per category
 *         (Foundation/Partners/Strategic/Public, etc.). Releases nothing during the
 *         cliff period, then unlocks linearly over time.
 *
 * Schedule fields:
 *   - beneficiary       : recipient address
 *   - totalAmount       : total allocation
 *   - startTime         : vesting start timestamp
 *   - cliffDuration     : cliff duration in seconds
 *   - vestingDuration   : total vesting duration including cliff, in seconds
 *   - released          : amount already withdrawn
 *   - revocable         : whether admin can revoke (true: Foundation/Partners, etc.)
 *   - revoked           : whether the schedule has been revoked
 */
contract CCMVesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant SCHEDULE_MANAGER_ROLE = keccak256("SCHEDULE_MANAGER_ROLE");

    IERC20 public immutable ccm;

    struct Schedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 released;
        bool    revocable;
        bool    revoked;
    }

    Schedule[] public schedules;
    mapping(address => uint256[]) public scheduleIdsOf;

    event ScheduleCreated(uint256 indexed id, address indexed beneficiary, uint256 amount,
                          uint256 startTime, uint256 cliffDuration, uint256 vestingDuration);
    event Released(uint256 indexed id, address indexed beneficiary, uint256 amount);
    event ScheduleRevoked(uint256 indexed id, uint256 unreleased);

    constructor(address ccm_, address admin) {
        require(ccm_ != address(0) && admin != address(0), "Vesting: zero addr");
        ccm = IERC20(ccm_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SCHEDULE_MANAGER_ROLE, admin);
    }

    /**
     * @notice Create a new vesting schedule. Tokens must be transferred to this contract first.
     * @param beneficiary     recipient
     * @param totalAmount     total allocation (wei)
     * @param startTime       start timestamp (seconds)
     * @param cliffDuration   cliff duration (seconds). Example: 1 year = 365 days
     * @param vestingDuration total vesting duration including cliff (seconds). Requires cliffDuration <= vestingDuration
     * @param revocable       whether the schedule can be revoked
     */
    function createSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external onlyRole(SCHEDULE_MANAGER_ROLE) returns (uint256 id) {
        require(beneficiary != address(0), "Vesting: beneficiary zero");
        require(totalAmount > 0, "Vesting: amount zero");
        require(vestingDuration > 0, "Vesting: duration zero");
        require(cliffDuration <= vestingDuration, "Vesting: cliff > duration");

        id = schedules.length;
        schedules.push(Schedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            startTime: startTime,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            released: 0,
            revocable: revocable,
            revoked: false
        }));
        scheduleIdsOf[beneficiary].push(id);

        emit ScheduleCreated(id, beneficiary, totalAmount, startTime, cliffDuration, vestingDuration);
    }

    /**
     * @notice Create many schedules in one call. Array lengths must match.
     *         Useful for gas-efficient pre-sale onboarding.
     * @return ids list of created schedule ids (in input order)
     */
    function createScheduleBatch(
        address[] calldata beneficiaries,
        uint256[] calldata totalAmounts,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external onlyRole(SCHEDULE_MANAGER_ROLE) returns (uint256[] memory ids) {
        uint256 n = beneficiaries.length;
        require(n > 0, "Vesting: empty batch");
        require(totalAmounts.length == n, "Vesting: length mismatch");
        require(vestingDuration > 0, "Vesting: duration zero");
        require(cliffDuration <= vestingDuration, "Vesting: cliff > duration");

        ids = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            address bene = beneficiaries[i];
            uint256 amt = totalAmounts[i];
            require(bene != address(0), "Vesting: beneficiary zero");
            require(amt > 0, "Vesting: amount zero");

            uint256 id = schedules.length;
            schedules.push(Schedule({
                beneficiary: bene,
                totalAmount: amt,
                startTime: startTime,
                cliffDuration: cliffDuration,
                vestingDuration: vestingDuration,
                released: 0,
                revocable: revocable,
                revoked: false
            }));
            scheduleIdsOf[bene].push(id);
            ids[i] = id;
            emit ScheduleCreated(id, bene, amt, startTime, cliffDuration, vestingDuration);
        }
    }

    /// @notice Amount unlocked but not yet released for the given schedule.
    function releasable(uint256 id) public view returns (uint256) {
        Schedule storage s = schedules[id];
        if (s.revoked) return 0;
        if (block.timestamp < s.startTime + s.cliffDuration) return 0;
        uint256 elapsed = block.timestamp - s.startTime;
        if (elapsed >= s.vestingDuration) {
            return s.totalAmount - s.released;
        }
        uint256 vested = (s.totalAmount * elapsed) / s.vestingDuration;
        return vested - s.released;
    }

    /// @notice Release the unlocked portion of caller's own schedule.
    function release(uint256 id) external nonReentrant {
        Schedule storage s = schedules[id];
        require(s.beneficiary == msg.sender, "Vesting: not beneficiary");
        uint256 amt = releasable(id);
        require(amt > 0, "Vesting: nothing to release");
        s.released += amt;
        ccm.safeTransfer(s.beneficiary, amt);
        emit Released(id, s.beneficiary, amt);
    }

    /// @notice Release all of caller's schedules in one call.
    function releaseAll() external nonReentrant {
        uint256[] memory ids = scheduleIdsOf[msg.sender];
        uint256 total;
        for (uint i = 0; i < ids.length; i++) {
            Schedule storage s = schedules[ids[i]];
            uint256 amt = releasable(ids[i]);
            if (amt > 0) {
                s.released += amt;
                total += amt;
                emit Released(ids[i], msg.sender, amt);
            }
        }
        require(total > 0, "Vesting: nothing to release");
        ccm.safeTransfer(msg.sender, total);
    }

    /// @notice Revoke a revocable schedule (admin only). Vested portion is paid to beneficiary first.
    function revoke(uint256 id) external onlyRole(SCHEDULE_MANAGER_ROLE) nonReentrant {
        Schedule storage s = schedules[id];
        require(s.revocable, "Vesting: not revocable");
        require(!s.revoked, "Vesting: already revoked");

        // pay out vested portion to beneficiary
        uint256 vested = releasable(id);
        if (vested > 0) {
            s.released += vested;
            ccm.safeTransfer(s.beneficiary, vested);
            emit Released(id, s.beneficiary, vested);
        }

        // remaining returns to admin (treasury)
        uint256 remaining = s.totalAmount - s.released;
        s.revoked = true;
        if (remaining > 0) {
            ccm.safeTransfer(msg.sender, remaining);
        }
        emit ScheduleRevoked(id, remaining);
    }

    function getScheduleCount() external view returns (uint256) {
        return schedules.length;
    }
}
