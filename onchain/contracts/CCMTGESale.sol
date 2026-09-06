// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM TGE Sale
 * @notice Multi-tier TGE sale. Seed @ $0.15 / Series A @ $0.20.
 *         KYC whitelist, USDC payment, automatic vesting/lock handling.
 *
 * Flow:
 *   1) Admin defines a round (price, hardCap, lock duration, etc.)
 *   2) Admin registers KYC-approved buyers in the whitelist
 *   3) Investor purchases with USDC → CCM is immediately locked in this contract
 *   4) After the lock period, investor claims per the vesting schedule
 *
 * Lock-up + Vesting:
 *   - Seed:      12-month cliff + 24-month linear vest
 *   - Series A:   6-month cliff + 12-month linear vest
 *
 * @dev US persons are blocked at a separate KYC oracle layer (OFAC + nationality).
 */
contract CCMTGESale is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable ccm;
    IERC20 public immutable usdc;

    struct Round {
        string  name;
        uint256 priceUsdc;        // CCM unit price (USDC, 6 decimals)
        uint256 hardCapTokens;    // max CCM sold in this round (18 decimals)
        uint256 soldTokens;       // cumulative sold amount
        uint256 cliffSeconds;     // lock cliff
        uint256 vestSeconds;      // total vesting duration including cliff
        uint256 startTime;        // sale start timestamp
        uint256 endTime;          // sale end timestamp
        bool    active;
    }

    Round[] public rounds;

    struct Allocation {
        uint256 totalAllocated;
        uint256 claimed;
        uint256 startTime;        // = round.startTime
        uint256 cliffSeconds;
        uint256 vestSeconds;
    }

    mapping(uint256 => mapping(address => Allocation)) public allocations;
    mapping(uint256 => mapping(address => bool)) public whitelist;

    // ----- Events -----
    event RoundCreated(uint256 indexed id, string name, uint256 priceUsdc, uint256 hardCap);
    event WhitelistSet(uint256 indexed roundId, address indexed user, bool ok);
    event Purchased(uint256 indexed roundId, address indexed buyer, uint256 ccmAmt, uint256 usdcPaid);
    event Claimed(uint256 indexed roundId, address indexed user, uint256 amount);
    event RoundClosed(uint256 indexed roundId);
    event UnsoldWithdrawn(uint256 indexed roundId, address indexed to, uint256 amount);

    constructor(address ccm_, address usdc_, address admin) {
        require(ccm_ != address(0) && usdc_ != address(0) && admin != address(0), "TGE: zero");
        ccm = IERC20(ccm_);
        usdc = IERC20(usdc_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================================
    //  Round management (admin)
    // ============================================================

    /**
     * @notice Create a new sale round. `hardCapTokens` worth of CCM must be transferred to this contract beforehand.
     */
    function createRound(
        string calldata name,
        uint256 priceUsdc,        // 6 decimals (USDC)
        uint256 hardCapTokens,    // 18 decimals (CCM)
        uint256 cliffSeconds,
        uint256 vestSeconds,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) returns (uint256 id) {
        require(priceUsdc > 0, "TGE: price zero");
        require(hardCapTokens > 0, "TGE: hardcap zero");
        require(vestSeconds >= cliffSeconds, "TGE: vest < cliff");
        require(endTime > startTime, "TGE: end < start");

        id = rounds.length;
        rounds.push(Round({
            name: name,
            priceUsdc: priceUsdc,
            hardCapTokens: hardCapTokens,
            soldTokens: 0,
            cliffSeconds: cliffSeconds,
            vestSeconds: vestSeconds,
            startTime: startTime,
            endTime: endTime,
            active: true
        }));
        emit RoundCreated(id, name, priceUsdc, hardCapTokens);
    }

    function closeRound(uint256 roundId) external onlyRole(ADMIN_ROLE) {
        require(rounds[roundId].active, "TGE: already closed");
        rounds[roundId].active = false;
        emit RoundClosed(roundId);
    }

    function setWhitelist(uint256 roundId, address user, bool ok) external onlyRole(ADMIN_ROLE) {
        whitelist[roundId][user] = ok;
        emit WhitelistSet(roundId, user, ok);
    }

    function setWhitelistBatch(uint256 roundId, address[] calldata usersList, bool ok)
        external onlyRole(ADMIN_ROLE)
    {
        for (uint i = 0; i < usersList.length; i++) {
            whitelist[roundId][usersList[i]] = ok;
            emit WhitelistSet(roundId, usersList[i], ok);
        }
    }

    // ============================================================
    //  Purchase
    // ============================================================

    /**
     * @notice Purchase CCM with USDC. CCM is locked in this contract and vests linearly after the cliff.
     * @param roundId   round to purchase from
     * @param ccmAmount amount of CCM to buy (18 decimals)
     */
    function purchase(uint256 roundId, uint256 ccmAmount) external nonReentrant {
        Round storage r = rounds[roundId];
        require(r.active, "TGE: round closed");
        require(block.timestamp >= r.startTime, "TGE: not started");
        require(block.timestamp <= r.endTime, "TGE: ended");
        require(whitelist[roundId][msg.sender], "TGE: not whitelisted");
        require(ccmAmount > 0, "TGE: zero amount");
        require(r.soldTokens + ccmAmount <= r.hardCapTokens, "TGE: hardcap exceeded");

        // USDC payment = ccmAmount(18d) × price(6d) / 1e18
        uint256 usdcAmount = (ccmAmount * r.priceUsdc) / 1e18;
        require(usdcAmount > 0, "TGE: usdc zero");

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        r.soldTokens += ccmAmount;

        Allocation storage a = allocations[roundId][msg.sender];
        if (a.totalAllocated == 0) {
            // first purchase
            a.startTime = r.startTime;
            a.cliffSeconds = r.cliffSeconds;
            a.vestSeconds = r.vestSeconds;
        }
        a.totalAllocated += ccmAmount;

        emit Purchased(roundId, msg.sender, ccmAmount, usdcAmount);
    }

    // ============================================================
    //  Claim (vested CCM)
    // ============================================================

    function claimable(uint256 roundId, address user) public view returns (uint256) {
        Allocation storage a = allocations[roundId][user];
        if (a.totalAllocated == 0) return 0;
        if (block.timestamp < a.startTime + a.cliffSeconds) return 0;
        uint256 elapsed = block.timestamp - a.startTime;
        uint256 vested;
        if (elapsed >= a.vestSeconds) {
            vested = a.totalAllocated;
        } else {
            vested = (a.totalAllocated * elapsed) / a.vestSeconds;
        }
        return vested - a.claimed;
    }

    function claim(uint256 roundId) external nonReentrant {
        uint256 amt = claimable(roundId, msg.sender);
        require(amt > 0, "TGE: nothing claimable");
        Allocation storage a = allocations[roundId][msg.sender];
        a.claimed += amt;
        ccm.safeTransfer(msg.sender, amt);
        emit Claimed(roundId, msg.sender, amt);
    }

    // ============================================================
    //  Withdraw raised funds (admin)
    // ============================================================

    function withdrawUSDC(address to, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "TGE: to zero");
        usdc.safeTransfer(to, amount);
    }

    /**
     * @notice Return the unsold CCM of a finished round to `to` (review R-04).
     * @dev Only once the round is closed or past `endTime`. Shrinks the round's
     *      hard cap to what was actually sold, so the remainder cannot be
     *      withdrawn twice and buyers' vesting allocations are untouched.
     */
    function withdrawUnsoldCCM(uint256 roundId, address to) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "TGE: to zero");
        Round storage r = rounds[roundId];
        require(!r.active || block.timestamp > r.endTime, "TGE: round open");
        uint256 unsold = r.hardCapTokens - r.soldTokens;
        require(unsold > 0, "TGE: nothing unsold");
        r.hardCapTokens = r.soldTokens;
        ccm.safeTransfer(to, unsold);
        emit UnsoldWithdrawn(roundId, to, unsold);
    }

    // ============================================================
    //  View helpers
    // ============================================================

    function getRound(uint256 id) external view returns (Round memory) {
        return rounds[id];
    }

    function getRoundCount() external view returns (uint256) {
        return rounds.length;
    }
}
