// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISandboxNFTMeta {
    function meta(uint256 id) external view returns (
        uint8 grade,
        uint16 vintage,
        uint256 tonnage,
        bytes32 projectId,
        address minter,
        uint64 mintedAt
    );
}

interface ICCMMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title CCM Sandbox Yield (TESTNET ONLY) — §7.6
 * @notice Hold-to-Earn: stake a CCMSandboxNFT batch, earn test CCM rewards
 *         over time. Yield rate scales with grade.
 *
 * Reward formula (per stake):
 *   reward = tonnage × elapsedSeconds × BASE_RATE × gradeWeight / 100
 *
 * Grade weights:
 *   A · DAC · 1000+ yr   ×4.0  (gradeWeight = 400)
 *   B · biochar · 100+   ×2.0  (gradeWeight = 200)
 *   C · reforest · 40+   ×1.0  (gradeWeight = 100)
 *   D · REDD+ · 10–40    ×0.5  (gradeWeight = 50)
 *
 * Sandbox tuning:
 *   BASE_RATE = 1e15 wei/(tonne·second) at weight=100 (Grade C).
 *   At Grade C, 1 tonne earns 0.0036 CCM/min ≈ 0.216 CCM/hr ≈ 5.18 CCM/day.
 *   At Grade A (×4): ~20.7 CCM/day per tonne.
 *
 * Lifecycle:
 *   stake(id, tonnage) → vault holds NFT, opens an active stake.
 *   pendingReward(stakeId) → live read of accrued, unclaimed rewards.
 *   claim(stakeId)        → mint accrued rewards, reset lastClaimedAt.
 *   unstake(stakeId)      → mint final accrued rewards, return NFT, mark closed.
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - Vault must hold MINTER_ROLE on the supplied CCMToken; granted after
 *     deploy by the admin (deploy script does this).
 *   - 5B hard-cap on CCMToken bounds eternal yield emissions.
 *   - ReentrancyGuard + CEI ordering on all state mutators.
 */
contract CCMSandboxYield is ERC1155Holder, ReentrancyGuard {
    IERC1155 public immutable nft;
    ISandboxNFTMeta public immutable nftMeta;
    ICCMMintable public immutable token;

    uint256 public constant BASE_RATE = 1e15;
    uint8 public constant GRADE_COUNT = 4;

    struct Stake {
        address staker;
        uint256 nftId;
        uint256 tonnage;
        uint8 grade;
        uint64 startedAt;
        uint64 lastClaimedAt;
        bool active;
    }

    Stake[] public stakes;
    mapping(address => uint256[]) private _userStakes;

    /// @notice Total tonnes currently staked across all active positions.
    uint256 public totalStaked;
    /// @notice Cumulative CCM minted as yield.
    uint256 public totalEarned;

    event Staked(uint256 indexed stakeId, address indexed staker, uint256 indexed nftId, uint8 grade, uint256 tonnage);
    event Claimed(uint256 indexed stakeId, address indexed staker, uint256 amount);
    event Unstaked(uint256 indexed stakeId, address indexed staker, uint256 amount);

    constructor(address nft_, address token_) {
        require(block.chainid != 8453, "Yield: refuse mainnet");
        require(nft_ != address(0) && token_ != address(0), "Yield: zero addr");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
        token = ICCMMintable(token_);
    }

    /// @notice Grade weight in 100-base. 100 = ×1.0, 400 = ×4.0, etc.
    function gradeWeight(uint8 g) public pure returns (uint256) {
        if (g == 0) return 400; // A
        if (g == 1) return 200; // B
        if (g == 2) return 100; // C
        if (g == 3) return 50;  // D
        revert("Yield: bad grade");
    }

    /**
     * @notice Open a new stake by depositing `tonnage` of NFT id.
     * @dev Caller must `nft.setApprovalForAll(this, true)` first.
     */
    function stake(uint256 nftId, uint256 tonnage)
        external
        nonReentrant
        returns (uint256 stakeId)
    {
        require(tonnage > 0, "Yield: zero tonnage");
        (uint8 grade, , , , , ) = nftMeta.meta(nftId);
        require(grade < GRADE_COUNT, "Yield: bad grade");

        stakeId = stakes.length;
        stakes.push(
            Stake({
                staker: msg.sender,
                nftId: nftId,
                tonnage: tonnage,
                grade: grade,
                startedAt: uint64(block.timestamp),
                lastClaimedAt: uint64(block.timestamp),
                active: true
            })
        );
        _userStakes[msg.sender].push(stakeId);
        totalStaked += tonnage;

        nft.safeTransferFrom(msg.sender, address(this), nftId, tonnage, "");
        emit Staked(stakeId, msg.sender, nftId, grade, tonnage);
    }

    /// @notice Accrued, unclaimed yield for a stake. Returns 0 if inactive.
    function pendingReward(uint256 stakeId) public view returns (uint256) {
        Stake memory s = stakes[stakeId];
        if (!s.active) return 0;
        uint256 elapsed = block.timestamp - uint256(s.lastClaimedAt);
        return (s.tonnage * elapsed * BASE_RATE * gradeWeight(s.grade)) / 100;
    }

    /// @notice Mint accrued yield to caller and reset the accrual clock.
    function claim(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[stakeId];
        require(s.active, "Yield: not active");
        require(s.staker == msg.sender, "Yield: not staker");

        uint256 reward = _pendingFromStorage(s);
        require(reward > 0, "Yield: nothing to claim");

        // EFFECTS
        s.lastClaimedAt = uint64(block.timestamp);
        totalEarned += reward;

        // INTERACTIONS
        token.mint(msg.sender, reward);
        emit Claimed(stakeId, msg.sender, reward);
    }

    /// @notice Withdraw NFT and mint any remaining accrued yield.
    function unstake(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[stakeId];
        require(s.active, "Yield: not active");
        require(s.staker == msg.sender, "Yield: not staker");

        uint256 reward = _pendingFromStorage(s);
        uint256 nftId = s.nftId;
        uint256 tonnage = s.tonnage;

        // EFFECTS
        s.active = false;
        totalStaked -= tonnage;
        if (reward > 0) {
            totalEarned += reward;
        }

        // INTERACTIONS
        if (reward > 0) {
            token.mint(msg.sender, reward);
        }
        nft.safeTransferFrom(address(this), msg.sender, nftId, tonnage, "");
        emit Unstaked(stakeId, msg.sender, reward);
    }

    /// @notice User's stake ids (active and inactive).
    function userStakesOf(address user) external view returns (uint256[] memory) {
        return _userStakes[user];
    }

    /// @notice Total stakes ever created.
    function stakeCount() external view returns (uint256) {
        return stakes.length;
    }

    function _pendingFromStorage(Stake storage s) internal view returns (uint256) {
        if (!s.active) return 0;
        uint256 elapsed = block.timestamp - uint256(s.lastClaimedAt);
        return (s.tonnage * elapsed * BASE_RATE * gradeWeight(s.grade)) / 100;
    }
}
