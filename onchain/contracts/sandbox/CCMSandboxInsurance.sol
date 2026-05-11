// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC1155SupplyView {
    function totalSupply(uint256 id) external view returns (uint256);
}

/**
 * @title CCM Sandbox Insurance Vault (TESTNET ONLY) — §7.7
 * @notice Pro-rata USDC payout to NFT holders when an underlying VVB
 *         consensus is later invalidated (fraud, methodology revision).
 *
 * Sandbox mechanics:
 *   - Vault is pre-funded with USDC (admin transfers in or anyone donates).
 *   - `declareFailure(nftId)`: anyone may call once per id. Snapshots
 *     `payoutPerTonne = (vault.usdc × FAILURE_POOL_BPS / 10_000) / totalSupply(id)`.
 *   - `claim(nftId, tonnage)`: holder transfers `tonnage` of NFT id to the
 *     vault (effectively burned — vault never releases) and receives
 *     `payoutPerTonne × tonnage` USDC.
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - Mainnet equivalent will be governed by a multi-VVB DAO + dispute
 *     resolution; here, anyone can declare failure for demonstration.
 *   - SafeERC20 + ReentrancyGuard.
 *   - One declaration per id ever. Subsequent claims after pool drain
 *     revert at the underlying USDC transfer.
 */
contract CCMSandboxInsurance is ERC1155Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC1155 public immutable nft;
    IERC1155SupplyView public immutable nftSupply;
    IERC20 public immutable usdc;

    /// @notice Fraction of vault reserves allocated per declared failure (basis points).
    uint256 public constant FAILURE_POOL_BPS = 3000; // 30%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    struct Failure {
        bool declared;
        uint256 payoutPerTonne; // raw USDC (6 decimals)
        uint256 budget;         // raw USDC reserved when declared
        uint256 atSupply;       // totalSupply(id) at declaration
        uint256 totalClaimed;   // tonnes claimed so far
        uint64 declaredAt;
        address declarer;
    }

    mapping(uint256 => Failure) public failures;
    uint256 public totalDeclared;
    uint256 public totalPaidOut;

    event FailureDeclared(
        uint256 indexed nftId,
        uint256 payoutPerTonne,
        uint256 budget,
        uint256 atSupply,
        address indexed declarer
    );
    event Claimed(
        uint256 indexed nftId,
        address indexed claimant,
        uint256 tonnage,
        uint256 usdcAmount
    );

    constructor(address nft_, address usdc_) {
        require(block.chainid != 8453, "Insurance: refuse mainnet");
        require(nft_ != address(0) && usdc_ != address(0), "Insurance: zero addr");
        nft = IERC1155(nft_);
        nftSupply = IERC1155SupplyView(nft_);
        usdc = IERC20(usdc_);
    }

    /// @notice Declare a VVB failure for `nftId`, freezing payoutPerTonne.
    /// @dev Anyone may call. One declaration per id ever (sandbox).
    function declareFailure(uint256 nftId) external nonReentrant {
        Failure storage f = failures[nftId];
        require(!f.declared, "Insurance: already declared");

        uint256 supply = nftSupply.totalSupply(nftId);
        require(supply > 0, "Insurance: no holders");

        uint256 reserves = usdc.balanceOf(address(this));
        uint256 budget = (reserves * FAILURE_POOL_BPS) / BPS_DENOMINATOR;
        require(budget > 0, "Insurance: no reserves");

        uint256 perTonne = budget / supply;
        require(perTonne > 0, "Insurance: per-tonne rounds to zero");

        f.declared = true;
        f.payoutPerTonne = perTonne;
        f.budget = budget;
        f.atSupply = supply;
        f.declaredAt = uint64(block.timestamp);
        f.declarer = msg.sender;
        totalDeclared++;

        emit FailureDeclared(nftId, perTonne, budget, supply, msg.sender);
    }

    /**
     * @notice Burn `tonnage` of NFT id (transfer to vault, never returns) and
     *         receive `payoutPerTonne × tonnage` USDC.
     * @dev Caller must `nft.setApprovalForAll(this, true)` first.
     */
    function claim(uint256 nftId, uint256 tonnage) external nonReentrant {
        require(tonnage > 0, "Insurance: zero tonnage");
        Failure storage f = failures[nftId];
        require(f.declared, "Insurance: not declared");

        uint256 amount = f.payoutPerTonne * tonnage;
        require(amount > 0, "Insurance: zero payout");
        require(
            usdc.balanceOf(address(this)) >= amount,
            "Insurance: pool drained"
        );

        // EFFECTS
        f.totalClaimed += tonnage;
        totalPaidOut += amount;

        // INTERACTIONS
        nft.safeTransferFrom(msg.sender, address(this), nftId, tonnage, "");
        usdc.safeTransfer(msg.sender, amount);

        emit Claimed(nftId, msg.sender, tonnage, amount);
    }

    /// @notice Current USDC reserves backing future claims.
    function reserves() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
