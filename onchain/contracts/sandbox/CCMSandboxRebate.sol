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

interface ICCMSandboxNFTRetire {
    function retire(uint256 id, uint256 amount) external;
}

interface ICCMMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title CCM Sandbox Retire-to-Earn (TESTNET ONLY) — §7.9
 * @notice Permanent NFT retirement that mints a $CCM rebate to the
 *         retirer. Aligns long-term offset programs with token-economic
 *         incentives (whitepaper §7.9).
 *
 * Mechanics (sandbox):
 *   1. Caller transfers `tonnage` of NFT id to this contract.
 *   2. Contract calls CCMSandboxNFT.retire(id, tonnage) — that burns the
 *      tonnes from this contract's balance, increments `retiredTotal`
 *      on the NFT.
 *   3. Contract mints `rebate = baseRebate[grade] × tonnage × multiplier`
 *      CCM to the caller.
 *   4. multiplier scales with the caller's cumulative retired tonnes
 *      across all calls to this contract:
 *        cumRetired <  100 t   → 1.0× (10000 bps)
 *        cumRetired ≥ 100 t    → 1.5× (15000 bps)
 *        cumRetired ≥ 1000 t   → 2.0× (20000 bps)
 *      The multiplier tier is computed BEFORE adding the current call's
 *      tonnage so a single large retirement doesn't unlock a higher tier
 *      mid-call.
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - Vault must hold MINTER_ROLE on the supplied CCMToken (granted at
 *     deploy time by deploy script).
 *   - 5B hard-cap on CCMToken bounds eternal rebate emissions.
 *   - ReentrancyGuard + CEI ordering.
 */
contract CCMSandboxRebate is ERC1155Holder, ReentrancyGuard {
    IERC1155 public immutable nft;
    ISandboxNFTMeta public immutable nftMeta;
    ICCMMintable public immutable token;

    /// @notice Base rebate per tonne by grade (raw CCM 18 dec).
    ///         A=2 CCM, B=1 CCM, C=0.5 CCM, D=0.2 CCM at the 1.0× tier.
    uint256 public constant REBATE_A = 2 * 10**18;
    uint256 public constant REBATE_B = 1 * 10**18;
    uint256 public constant REBATE_C = 5 * 10**17;
    uint256 public constant REBATE_D = 2 * 10**17;

    /// @notice Cumulative-tonnes thresholds for tier transitions.
    uint256 public constant TIER_2_THRESHOLD = 100;
    uint256 public constant TIER_3_THRESHOLD = 1_000;

    uint8 public constant GRADE_COUNT = 4;
    uint16 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Cumulative tonnes retired through this contract per address.
    mapping(address => uint256) public cumulativeRetired;

    /// @notice Lifetime totals for sandbox metrics.
    uint256 public totalRetired;
    uint256 public totalRebated;

    event RetiredWithRebate(
        address indexed retirer,
        uint256 indexed nftId,
        uint8 indexed grade,
        uint256 tonnage,
        uint256 rebateAmount,
        uint16 multiplierBps
    );

    constructor(address nft_, address token_) {
        require(block.chainid != 8453, "Rebate: refuse mainnet");
        require(nft_ != address(0) && token_ != address(0), "Rebate: zero addr");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
        token = ICCMMintable(token_);
    }

    /**
     * @notice Permanently retire `tonnage` of NFT id and receive a CCM rebate.
     * @dev Caller must `nft.setApprovalForAll(this, true)` first.
     * @return rebateAmount Raw CCM minted to caller (18 decimals).
     */
    function retire(uint256 nftId, uint256 tonnage)
        external
        nonReentrant
        returns (uint256 rebateAmount)
    {
        require(tonnage > 0, "Rebate: zero tonnage");
        (uint8 grade, , , , , ) = nftMeta.meta(nftId);
        require(grade < GRADE_COUNT, "Rebate: bad grade");

        uint256 base = baseRebatePerTonne(grade);
        uint16 mult = currentMultiplierBps(msg.sender);
        rebateAmount = (base * tonnage * uint256(mult)) / BPS_DENOMINATOR;

        // EFFECTS first
        cumulativeRetired[msg.sender] += tonnage;
        totalRetired += tonnage;
        if (rebateAmount > 0) {
            totalRebated += rebateAmount;
        }

        // INTERACTIONS
        // 1. Pull NFT into this contract.
        nft.safeTransferFrom(msg.sender, address(this), nftId, tonnage, "");
        // 2. Permanently burn it on the NFT contract.
        ICCMSandboxNFTRetire(address(nft)).retire(nftId, tonnage);
        // 3. Mint rebate to caller.
        if (rebateAmount > 0) {
            token.mint(msg.sender, rebateAmount);
        }

        emit RetiredWithRebate(msg.sender, nftId, grade, tonnage, rebateAmount, mult);
    }

    /// @notice Per-grade base rebate (raw CCM, 18 decimals, at the 1.0× tier).
    function baseRebatePerTonne(uint8 grade) public pure returns (uint256) {
        if (grade == 0) return REBATE_A;
        if (grade == 1) return REBATE_B;
        if (grade == 2) return REBATE_C;
        if (grade == 3) return REBATE_D;
        revert("Rebate: bad grade");
    }

    /// @notice Current multiplier tier for `user` based on cumulative tonnes retired.
    /// @return multiplierBps 10000 (1.0×), 15000 (1.5×), or 20000 (2.0×).
    function currentMultiplierBps(address user) public view returns (uint16) {
        uint256 c = cumulativeRetired[user];
        if (c >= TIER_3_THRESHOLD) return 20_000;
        if (c >= TIER_2_THRESHOLD) return 15_000;
        return 10_000;
    }

    /// @notice Preview the rebate that would be paid for `tonnage` of `grade`.
    function quoteRebate(address user, uint8 grade, uint256 tonnage)
        external
        view
        returns (uint256 rebateAmount, uint16 multiplierBps)
    {
        require(grade < GRADE_COUNT, "Rebate: bad grade");
        multiplierBps = currentMultiplierBps(user);
        rebateAmount = (baseRebatePerTonne(grade) * tonnage * uint256(multiplierBps)) / BPS_DENOMINATOR;
    }
}
