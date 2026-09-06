// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM Early-Investor Staking Pool
 * @notice Staking pool restricted to early investors via an eligibility whitelist.
 *         Yield rate is price-elastic and decays automatically.
 *         Emissions stop automatically when the pool cap is exhausted.
 *
 *  yield_rate(P, pool) = R₀ × (P_TGE / P) × (pool_left / pool_init)
 *      ≤ R₀ = 10%/month  (cap, initial = maximum)
 *      → 0%/month        (natural termination once the pool is drained)
 *
 * Architecture:
 *   - Eligibility whitelist managed via the `eligible` mapping
 *   - Reward pool of 200M $CCM (set in constructor)
 *   - External price oracle (Chainlink AggregatorV3 or custom implementation)
 *   - Reward accrued automatically on every staking state change
 */
interface IPriceOracle {
    /// @return price $CCM price in USD, denominated in 18-decimal wei
    function getPrice() external view returns (uint256 price);
}

contract CCMStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20         public immutable ccm;
    IPriceOracle   public priceOracle;

    // ----- Constants -----
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BPS = 10_000;           // basis points
    uint256 public constant R0_BPS = 1_000;         // 10%/month max yield
    uint256 public immutable P0_TGE;                // TGE reference price (18 decimals USD)
    uint256 public immutable POOL_INIT;             // 200M * 1e18

    // ----- State -----
    uint256 public poolRemaining;
    uint256 public totalStaked;

    struct UserInfo {
        uint256 staked;          // staked tokens
        uint256 rewardDebt;      // accumulator of paid rewards (auto-compound model)
        uint256 lastUpdate;      // last reward calc timestamp
    }

    mapping(address => UserInfo) public users;
    mapping(address => bool) public eligible;

    // ----- Events -----
    event EligibilitySet(address indexed user, bool eligible);
    event Staked(address indexed user, uint256 amount, uint256 newBalance);
    event Unstaked(address indexed user, uint256 amount, uint256 newBalance);
    event RewardClaimed(address indexed user, uint256 amount, uint256 poolRemaining);
    event OracleUpdated(address newOracle);

    constructor(
        address ccm_,
        address oracle_,
        uint256 p0Tge_,        // e.g., 0.15 USD = 15 * 10**16
        uint256 poolInit_,     // e.g., 200_000_000 * 10**18
        address admin
    ) {
        require(ccm_ != address(0) && oracle_ != address(0) && admin != address(0), "Staking: zero");
        require(p0Tge_ > 0 && poolInit_ > 0, "Staking: invalid params");
        ccm = IERC20(ccm_);
        priceOracle = IPriceOracle(oracle_);
        P0_TGE = p0Tge_;
        POOL_INIT = poolInit_;
        poolRemaining = poolInit_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================================
    //  Eligibility (whitelist)
    // ============================================================

    function setEligible(address user, bool ok) external onlyRole(ADMIN_ROLE) {
        eligible[user] = ok;
        emit EligibilitySet(user, ok);
    }

    function setEligibleBatch(address[] calldata usersList, bool ok) external onlyRole(ADMIN_ROLE) {
        for (uint i = 0; i < usersList.length; i++) {
            eligible[usersList[i]] = ok;
            emit EligibilitySet(usersList[i], ok);
        }
    }

    // ============================================================
    //  Yield rate calculation
    // ============================================================

    /**
     * @notice Current monthly yield rate, in basis points.
     * @return rateBps  yield rate in basis points (1000 = 10%)
     */
    /// @dev Oracle price, or 0 when the oracle reverts. A dead oracle must
    ///      degrade to a 0% rate, never lock principal (review R-02).
    function _oraclePrice() internal view returns (uint256) {
        try priceOracle.getPrice() returns (uint256 p) {
            return p;
        } catch {
            return 0;
        }
    }

    /// @notice CCM held by this contract beyond stakers' principal — the only
    ///         tokens rewards may ever be paid from (review R-01).
    function availableRewards() public view returns (uint256) {
        uint256 bal = ccm.balanceOf(address(this));
        return bal > totalStaked ? bal - totalStaked : 0;
    }

    function currentYieldRateBps() public view returns (uint256 rateBps) {
        if (poolRemaining == 0) return 0;
        uint256 currentPrice = _oraclePrice();
        if (currentPrice == 0) return 0;

        // priceFactor = P0_TGE / P_current   (1e18 fixed point)
        uint256 priceFactor = (P0_TGE * 1e18) / currentPrice;
        // poolFactor = pool_remaining / pool_init  (1e18 fixed point)
        uint256 poolFactor = (poolRemaining * 1e18) / POOL_INIT;

        // rate = R0_BPS * priceFactor * poolFactor / (1e18 * 1e18)
        uint256 rate = (R0_BPS * priceFactor * poolFactor) / (1e18 * 1e18);

        // cap at R0
        if (rate > R0_BPS) rate = R0_BPS;
        return rate;
    }

    /// @notice Outstanding reward for a user (read-only simulation, no state change).
    function pendingReward(address user) public view returns (uint256) {
        UserInfo storage u = users[user];
        if (u.staked == 0) return 0;
        uint256 elapsed = block.timestamp - u.lastUpdate;
        if (elapsed == 0) return 0;
        uint256 rateBps = currentYieldRateBps();
        // reward = staked × rateBps × elapsed / (BPS × seconds_per_month)
        uint256 reward = (u.staked * rateBps * elapsed) / (BPS * SECONDS_PER_MONTH);
        if (reward > poolRemaining) reward = poolRemaining;
        // Never pay out of other stakers' principal: cap to funded surplus.
        uint256 avail = availableRewards();
        if (reward > avail) reward = avail;
        return reward;
    }

    /// @dev Internal reward payout: state update + transfer.
    function _harvest(address user) internal returns (uint256 reward) {
        UserInfo storage u = users[user];
        if (u.staked == 0) {
            u.lastUpdate = block.timestamp;
            return 0;
        }
        reward = pendingReward(user);
        if (reward > 0) {
            poolRemaining -= reward;
            ccm.safeTransfer(user, reward);
            emit RewardClaimed(user, reward, poolRemaining);
        }
        u.lastUpdate = block.timestamp;
    }

    // ============================================================
    //  Stake / Unstake / Claim
    // ============================================================

    function stake(uint256 amount) external nonReentrant {
        require(eligible[msg.sender], "Staking: not eligible");
        require(amount > 0, "Staking: zero amount");

        _harvest(msg.sender);
        ccm.safeTransferFrom(msg.sender, address(this), amount);

        UserInfo storage u = users[msg.sender];
        u.staked += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount, u.staked);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = users[msg.sender];
        require(u.staked >= amount, "Staking: insufficient stake");
        require(amount > 0, "Staking: zero amount");

        _harvest(msg.sender);
        u.staked -= amount;
        totalStaked -= amount;
        ccm.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, u.staked);
    }

    function claim() external nonReentrant {
        _harvest(msg.sender);
    }

    // ============================================================
    //  Admin
    // ============================================================

    function updateOracle(address newOracle) external onlyRole(ADMIN_ROLE) {
        require(newOracle != address(0), "Staking: oracle zero");
        priceOracle = IPriceOracle(newOracle);
        emit OracleUpdated(newOracle);
    }

    /// @notice Recover the remaining pool after exhaustion (call only after all users have unstaked).
    function recoverPoolRemainder() external onlyRole(ADMIN_ROLE) nonReentrant {
        require(totalStaked == 0, "Staking: users still staked");
        uint256 amt = poolRemaining;
        uint256 avail = availableRewards();
        if (amt > avail) amt = avail; // bookkeeping may exceed what was actually funded
        poolRemaining = 0;
        ccm.safeTransfer(msg.sender, amt);
    }

    // ============================================================
    //  View helpers
    // ============================================================

    function poolUsedPct() external view returns (uint256 pct) {
        // basis points: 10000 = 100%
        return ((POOL_INIT - poolRemaining) * 10000) / POOL_INIT;
    }
}
