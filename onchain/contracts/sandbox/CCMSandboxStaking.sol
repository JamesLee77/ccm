// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM Sandbox Staking — testnet variant of CCMStaking
 * @notice Identical mechanics to CCMStaking (price-elastic decaying yield,
 *         capped at 10%/month, emissions stop when pool drains) but WITHOUT
 *         the eligibility whitelist. Anyone can stake.
 *
 * Used only on Base Sepolia for the testnet.ccmnetwork.net playground.
 *
 * Differences from CCMStaking:
 *   - No `eligible` mapping
 *   - No `setEligible*` admin functions
 *   - `stake()` does not require eligibility
 *   - Constructor refuses chainId 8453 (mainnet) — sandbox safety guard
 *
 * Funding model: transfer-from-balance. The reward pool is the contract's
 * own ERC20 balance. The admin transfers `POOL_INIT` CCM into the contract
 * after deploy. `poolRemaining` is bookkeeping; physical payout comes from
 * the contract's balance via `ccm.safeTransfer(...)`.
 */
interface IPriceOracle {
    function getPrice() external view returns (uint256 price);
}

contract CCMSandboxStaking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BPS = 10_000;
    uint256 public constant R0_BPS = 1_000; // 10%/month

    IERC20  public immutable ccm;
    IPriceOracle public priceOracle;
    uint256 public immutable P0_TGE;
    uint256 public immutable POOL_INIT;

    uint256 public poolRemaining;
    uint256 public totalStaked;

    struct UserInfo {
        uint256 staked;
        uint256 lastAccruedAt; // timestamp of last harvest
    }
    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount, uint256 newBalance);
    event Unstaked(address indexed user, uint256 amount, uint256 newBalance);
    event RewardClaimed(address indexed user, uint256 amount, uint256 poolRemaining);
    event OracleUpdated(address newOracle);

    constructor(
        address ccm_,
        address oracle_,
        uint256 p0Tge_,
        uint256 poolInit_,
        address admin
    ) {
        require(block.chainid != 8453, "SandboxStaking: refuses mainnet");
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

    // --- yield rate -------------------------------------------------

    function currentYieldRateBps() public view returns (uint256 rateBps) {
        if (poolRemaining == 0) return 0;
        uint256 currentPrice = priceOracle.getPrice();
        if (currentPrice == 0) return 0;
        // R0 × (P_TGE / P) × (poolLeft / poolInit)
        uint256 priceFactor = (P0_TGE * 1e18) / currentPrice;
        uint256 poolFactor  = (poolRemaining * 1e18) / POOL_INIT;
        uint256 r = (R0_BPS * priceFactor / 1e18) * poolFactor / 1e18;
        return r > R0_BPS ? R0_BPS : r;
    }

    function pendingReward(address user) public view returns (uint256) {
        UserInfo storage u = users[user];
        if (u.staked == 0 || u.lastAccruedAt == 0) return 0;
        uint256 dt = block.timestamp - u.lastAccruedAt;
        uint256 r = currentYieldRateBps();
        uint256 owed = (u.staked * r * dt) / (BPS * SECONDS_PER_MONTH);
        if (owed > poolRemaining) owed = poolRemaining;
        return owed;
    }

    function poolUsedPct() external view returns (uint256 pct) {
        return ((POOL_INIT - poolRemaining) * 1e4) / POOL_INIT; // basis points
    }

    // --- write -------------------------------------------------------

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Staking: zero amount");
        _harvest(msg.sender);
        ccm.safeTransferFrom(msg.sender, address(this), amount);
        UserInfo storage u = users[msg.sender];
        u.staked += amount;
        if (u.lastAccruedAt == 0) u.lastAccruedAt = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount, u.staked);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = users[msg.sender];
        require(amount > 0 && amount <= u.staked, "Staking: bad amount");
        _harvest(msg.sender);
        u.staked -= amount;
        totalStaked -= amount;
        ccm.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, u.staked);
    }

    function claim() external nonReentrant {
        _harvest(msg.sender);
    }

    function _harvest(address user) internal {
        UserInfo storage u = users[user];
        if (u.staked == 0) {
            u.lastAccruedAt = block.timestamp;
            return;
        }
        uint256 owed = pendingReward(user);
        u.lastAccruedAt = block.timestamp;
        if (owed == 0) return;
        poolRemaining -= owed;
        ccm.safeTransfer(user, owed);
        emit RewardClaimed(user, owed, poolRemaining);
    }

    // --- admin -------------------------------------------------------

    function updateOracle(address newOracle) external onlyRole(ADMIN_ROLE) {
        require(newOracle != address(0), "Staking: zero oracle");
        priceOracle = IPriceOracle(newOracle);
        emit OracleUpdated(newOracle);
    }
}
