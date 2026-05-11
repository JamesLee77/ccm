// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICCMVaultToken {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

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

/**
 * @title CCM Sandbox Vault (TESTNET ONLY)
 * @notice Demonstrates the §7.2 Wrap/Unwrap primitive on the public testnet
 *         sandbox. Each call holds source-of-truth NFTs as collateral and
 *         mints fungible test CCM 1:1; unwrap reverses the operation,
 *         delivering NFTs back from a grade-D-first FIFO queue (FIFR —
 *         "first-in, first-redeemed").
 *
 * @dev SAFETY:
 *   - Sandbox-only. The mainnet wrap vault will gate operations behind a
 *     multisig + timelock with the production CCMToken; granting MINTER_ROLE
 *     to this open vault on a mainnet token would break the cap-allocation
 *     policy.
 *   - Constructor refuses chainId 8453 (Base mainnet) at the contract level.
 *   - 1:1 invariant maintained by construction: wrap mints exactly the
 *     deposited tonnage; unwrap returns exactly the burned tonnage.
 *   - FIFR is enforced in-contract: lower-grade entries are returned first
 *     (D → C → B → A). Within a grade, entries are FIFO (oldest deposit first).
 *   - Per-tx hop cap (`MAX_HOPS_PER_UNWRAP`) bounds gas. Users wanting to
 *     unwrap larger amounts split across multiple txs.
 *   - ReentrancyGuard on wrap/unwrap. CEI-ordered: state updates before
 *     external NFT transfer / token mint+burn.
 *
 * Usage:
 *   wrap:
 *     1. user calls nft.setApprovalForAll(vault, true)  (once)
 *     2. user calls vault.wrap(id, amount)
 *        → vault pulls NFT, appends to queue[grade], mints CCM to user
 *
 *   unwrap:
 *     1. user calls token.approve(vault, amount)
 *     2. user calls vault.unwrap(amount)
 *        → vault burns CCM, walks queues D→C→B→A, returns NFTs to user
 */
contract CCMSandboxVault is ERC1155Holder, ReentrancyGuard {
    /// @notice The sandbox NFT (ERC-1155 with on-chain `meta(id)`).
    IERC1155 public immutable nft;
    /// @notice Same address as `nft` cast to the meta interface.
    ISandboxNFTMeta public immutable nftMeta;
    /// @notice The sandbox CCMToken (ERC-20 with mint + burnFrom).
    ICCMVaultToken public immutable token;

    uint8 public constant GRADE_COUNT = 4; // A=0, B=1, C=2, D=3
    uint256 public constant MAX_HOPS_PER_UNWRAP = 5;
    /// @notice 1 NFT amount unit (= 1 tCO₂e) maps to 10^18 CCM atoms (= 1 CCM,
    ///         since CCMToken has 18 decimals). The vault enforces this scale
    ///         so user-visible balances are 1:1 with tonnage.
    uint256 public constant TOKEN_PER_TONNE = 1e18;

    struct Entry {
        uint256 id;
        uint256 amount; // remaining tonnes from this deposit
    }

    // queue[grade][index] = Entry
    mapping(uint8 => mapping(uint256 => Entry)) private queue;
    mapping(uint8 => uint256) public queueHead;  // first valid index
    mapping(uint8 => uint256) public queueTail;  // next-write index (exclusive)
    /// @notice Total tonnes locked in the vault, by grade.
    mapping(uint8 => uint256) public gradeBalance;
    /// @notice Cumulative tonnes wrapped through this vault (lifetime).
    uint256 public totalWrapped;
    /// @notice Cumulative tonnes unwrapped through this vault (lifetime).
    uint256 public totalUnwrapped;

    event Wrapped(address indexed user, uint256 indexed id, uint8 indexed grade, uint256 amount);
    event Unwrapped(address indexed user, uint256 indexed id, uint8 indexed grade, uint256 amount);

    constructor(address nft_, address token_) {
        require(block.chainid != 8453, "SandboxVault: refuse mainnet");
        require(nft_ != address(0) && token_ != address(0), "SandboxVault: zero addr");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
        token = ICCMVaultToken(token_);
    }

    /**
     * @notice Wrap `tonnage` units of NFT id into `tonnage` CCM (1 tonne → 1 CCM).
     * @dev User must `nft.setApprovalForAll(this, true)` beforehand.
     *      Mints `tonnage * 10^18` raw CCM atoms (since CCMToken has 18 decimals).
     */
    function wrap(uint256 id, uint256 tonnage) external nonReentrant {
        require(tonnage > 0, "SandboxVault: zero amount");

        (uint8 grade, , , , , ) = nftMeta.meta(id);
        require(grade < GRADE_COUNT, "SandboxVault: bad grade");

        // EFFECTS first (state update before external call)
        uint256 idx = queueTail[grade];
        queue[grade][idx] = Entry({id: id, amount: tonnage});
        queueTail[grade] = idx + 1;
        gradeBalance[grade] += tonnage;
        totalWrapped += tonnage;

        // INTERACTIONS (external)
        nft.safeTransferFrom(msg.sender, address(this), id, tonnage, "");
        token.mint(msg.sender, tonnage * TOKEN_PER_TONNE);

        emit Wrapped(msg.sender, id, grade, tonnage);
    }

    /**
     * @notice Unwrap `ccmAmount` CCM into NFTs (FIFR: lowest grade first).
     * @dev User must `token.approve(this, ccmAmount)` beforehand.
     *      `ccmAmount` is in raw CCM atoms (18 decimals). Must be a whole-tonne
     *      multiple of `TOKEN_PER_TONNE`. Reverts with "too many hops" if the
     *      queue requires more than MAX_HOPS_PER_UNWRAP transitions; split
     *      the unwrap across multiple txs in that case.
     */
    function unwrap(uint256 ccmAmount) external nonReentrant {
        require(ccmAmount > 0, "SandboxVault: zero amount");
        require(ccmAmount % TOKEN_PER_TONNE == 0, "SandboxVault: must be whole tonnes");

        // INTERACTION: burn CCM from caller (requires allowance)
        token.burnFrom(msg.sender, ccmAmount);

        uint256 hops;
        uint256 remaining = ccmAmount / TOKEN_PER_TONNE;

        // Iterate grades D → C → B → A
        for (uint8 g = GRADE_COUNT; g > 0 && remaining > 0; ) {
            unchecked { g--; }
            uint8 grade = g;
            uint256 head = queueHead[grade];
            uint256 tail = queueTail[grade];

            while (head < tail && remaining > 0) {
                require(hops < MAX_HOPS_PER_UNWRAP, "SandboxVault: too many hops, split unwrap");
                Entry storage e = queue[grade][head];
                uint256 take = e.amount < remaining ? e.amount : remaining;

                // EFFECTS first: update state
                remaining -= take;
                gradeBalance[grade] -= take;
                totalUnwrapped += take;

                uint256 returnedId = e.id;
                if (e.amount == take) {
                    delete queue[grade][head];
                    head++;
                } else {
                    e.amount -= take;
                }
                hops++;

                // INTERACTION: send NFT back to caller
                nft.safeTransferFrom(address(this), msg.sender, returnedId, take, "");
                emit Unwrapped(msg.sender, returnedId, grade, take);
            }
            queueHead[grade] = head;
        }

        require(remaining == 0, "SandboxVault: insufficient tonnes in vault");
    }

    /// @notice Returns the next entry that would be redeemed by an unwrap call.
    function previewUnwrapHead() external view returns (uint8 grade, uint256 id, uint256 available) {
        for (uint8 g = GRADE_COUNT; g > 0; ) {
            unchecked { g--; }
            uint256 head = queueHead[g];
            uint256 tail = queueTail[g];
            if (head < tail) {
                Entry storage e = queue[g][head];
                return (g, e.id, e.amount);
            }
        }
        return (0, 0, 0); // empty vault
    }

    /// @notice The number of pending entries in queue[grade].
    function queueLength(uint8 grade) external view returns (uint256) {
        require(grade < GRADE_COUNT, "SandboxVault: bad grade");
        return queueTail[grade] - queueHead[grade];
    }

    /// @notice Inspect a specific entry by absolute index (head-based).
    function queueEntry(uint8 grade, uint256 index) external view returns (uint256 id, uint256 amount) {
        require(grade < GRADE_COUNT, "SandboxVault: bad grade");
        Entry storage e = queue[grade][index];
        return (e.id, e.amount);
    }
}
