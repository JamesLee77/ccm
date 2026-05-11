// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title CCM Sandbox NFT (TESTNET ONLY)
 * @notice Open-mint ERC-1155 demonstrating the CCM-NFT carbon-credit unit
 *         that mainnet will issue. Each token id represents one batch
 *         from a single project (grade · vintage · tonnage · projectId);
 *         the ERC-1155 `amount` is the batch's tonnage in whole tCO₂e.
 *
 * @dev SAFETY:
 *   - Sandbox-only. The mainnet CCM-NFT will be issued exclusively under
 *     a multi-VVB consensus quorum after MRV + oracle attestation
 *     (whitepaper §6). The "anyone can mint" surface here exists strictly
 *     so the public testnet sandbox at testnet.ccmnetwork.net can let
 *     visitors experience the unit without admin gating.
 *   - Constructor refuses chain ID 8453 (Base mainnet) — mainnet deploy
 *     is impossible from the deploy script (extra belt-and-braces in the
 *     constructor itself in case the script is bypassed).
 *   - Per-address mint cooldown (1h) and per-mint tonnage cap (1,000 t)
 *     bound the sandbox state.
 *   - Anyone holding a balance can retire (burn) under their own custody.
 */
contract CCMSandboxNFT is ERC1155, ERC1155Supply {
    /// @notice Carbon-credit grade ladder (A best, D weakest).
    enum Grade {
        A,
        B,
        C,
        D
    }

    struct Metadata {
        Grade grade;
        uint16 vintage;     // year, e.g. 2026
        uint256 tonnage;    // tCO2e in this batch (= ERC-1155 amount minted)
        bytes32 projectId;  // arbitrary identifier (sandbox: caller-supplied)
        address minter;
        uint64 mintedAt;
    }

    /// @notice Auto-increment id counter. The next mint will get this id.
    uint256 public nextId;

    /// @notice Per-id metadata snapshot, set at mint, never mutated.
    mapping(uint256 => Metadata) public meta;

    /// @notice Last unix timestamp at which `user` minted (0 = never).
    mapping(address => uint256) public lastMint;

    /// @notice Cumulative tonnage retired (burned) through this contract.
    uint256 public retiredTotal;

    uint256 public constant MINT_COOLDOWN = 1 hours;
    uint256 public constant MAX_TONNAGE = 1_000;
    uint16 public constant MIN_VINTAGE = 2020;
    uint16 public constant MAX_VINTAGE = 2030;

    event Minted(
        address indexed to,
        uint256 indexed id,
        Grade grade,
        uint16 vintage,
        uint256 tonnage,
        bytes32 projectId
    );

    event Retired(
        address indexed retirer,
        uint256 indexed id,
        uint256 amount,
        uint256 timestamp
    );

    constructor() ERC1155("") {
        require(block.chainid != 8453, "Sandbox: refuse mainnet");
    }

    /**
     * @notice Mint a new sandbox carbon-credit batch to msg.sender.
     * @return id The newly assigned token id.
     */
    function mint(
        Grade grade,
        uint16 vintage,
        uint256 tonnage,
        bytes32 projectId
    ) external returns (uint256 id) {
        require(uint8(grade) <= uint8(Grade.D), "Sandbox: grade range");
        require(vintage >= MIN_VINTAGE && vintage <= MAX_VINTAGE, "Sandbox: vintage range");
        require(tonnage > 0 && tonnage <= MAX_TONNAGE, "Sandbox: tonnage range");

        uint256 last = lastMint[msg.sender];
        require(
            last == 0 || block.timestamp >= last + MINT_COOLDOWN,
            "Sandbox: cooldown"
        );

        lastMint[msg.sender] = block.timestamp;
        id = nextId++;
        meta[id] = Metadata({
            grade: grade,
            vintage: vintage,
            tonnage: tonnage,
            projectId: projectId,
            minter: msg.sender,
            mintedAt: uint64(block.timestamp)
        });
        _mint(msg.sender, id, tonnage, "");
        emit Minted(msg.sender, id, grade, vintage, tonnage, projectId);
    }

    /**
     * @notice Permanently retire (burn) `amount` units of token `id` from caller.
     * @dev The retirement is final — burned NFTs cannot be reconstituted.
     *      `retiredTotal` is the on-chain claim ledger anyone can audit.
     */
    function retire(uint256 id, uint256 amount) external {
        require(amount > 0, "Sandbox: zero amount");
        _burn(msg.sender, id, amount);
        retiredTotal += amount;
        emit Retired(msg.sender, id, amount, block.timestamp);
    }

    // --- View helpers ---

    /// @notice Unix timestamp at which `user` may next mint, or 0 if never minted.
    function nextMintAt(address user) external view returns (uint256) {
        uint256 last = lastMint[user];
        return last == 0 ? 0 : last + MINT_COOLDOWN;
    }

    /// @notice Seconds remaining until `user` can mint again, or 0 if ready.
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastMint[user];
        if (last == 0) return 0;
        uint256 next = last + MINT_COOLDOWN;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }

    // --- Required override for ERC1155Supply ---

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
