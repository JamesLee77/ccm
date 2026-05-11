// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
 * @title CCM Fraction Token (TESTNET ONLY)
 * @notice Minimal ERC-20 representing fractional shares of one CCMSandboxNFT
 *         batch. Single trusted minter (the fractionalizer vault).
 *
 * @dev Same trusted-minter pattern as CCMGradeToken (§7.3). Public users
 *      can transfer/approve normally; only the vault can mint or burn.
 *      To reclaim the underlying NFT a user must hold the full circulating
 *      supply and call `reassemble()` on the vault.
 */
contract CCMFractionToken is ERC20 {
    address public immutable minter;

    constructor(string memory name_, string memory symbol_, address minter_) ERC20(name_, symbol_) {
        require(minter_ != address(0), "FracToken: zero minter");
        minter = minter_;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "FracToken: not minter");
        _mint(to, amount);
    }

    function burnFromMinter(address account, uint256 amount) external {
        require(msg.sender == minter, "FracToken: not minter");
        _burn(account, amount);
    }
}

/**
 * @title CCM Sandbox Fractionalizer (TESTNET ONLY) — §7.5
 * @notice Splits one CCMSandboxNFT batch into a fungible ERC-20 fraction
 *         series. Reassembly requires reacquiring the full circulating
 *         supply, then calling `reassemble()` to swap fractions back for
 *         the underlying NFT.
 *
 * Mechanics:
 *   - `fractionalize(id, tonnage)`: caller deposits `tonnage` of NFT id
 *     into the vault. The vault deploys (or reuses) a per-id ERC-20
 *     called FRAC{id} and mints `tonnage * 10^18` to the caller.
 *   - `reassemble(id)`: caller must hold every outstanding fraction
 *     (`lockedTonnage[id] * 10^18`). The vault burns them all and
 *     returns the locked NFT batch to caller.
 *   - One series per id at a time. Re-fractionalization after a full
 *     reassembly reuses the same ERC-20 (same name/symbol).
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - 1:1 invariant by construction: lockedTonnage[id] * 10^18 ==
 *     fractionToken[id].totalSupply() while a series is active.
 *   - ReentrancyGuard + CEI ordering.
 *   - Fraction token has no public burn — supply can only contract via
 *     the wrapper's own reassembly, preserving the invariant.
 */
contract CCMSandboxFractionalizer is ERC1155Holder, ReentrancyGuard {
    using Strings for uint256;

    IERC1155 public immutable nft;
    ISandboxNFTMeta public immutable nftMeta;
    uint256 public constant TOKEN_PER_TONNE = 1e18;

    /// @notice nftId → fraction ERC-20 address (zero if never fractionalized).
    mapping(uint256 => address) public fractionToken;
    /// @notice nftId → currently-locked tonnage (0 if not active).
    mapping(uint256 => uint256) public lockedTonnage;

    uint256 public totalActiveSeries;

    event Fractionalized(uint256 indexed nftId, address indexed fractionToken, address indexed user, uint256 tonnage);
    event Reassembled(uint256 indexed nftId, address indexed user, uint256 tonnage);

    constructor(address nft_) {
        require(block.chainid != 8453, "Fractionalizer: refuse mainnet");
        require(nft_ != address(0), "Fractionalizer: zero nft");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
    }

    /**
     * @notice Lock `tonnage` units of NFT id and mint that many fraction tokens.
     * @dev User must `nft.setApprovalForAll(this, true)` first. Same id can
     *      only be fractionalized once at a time; reassemble first to start
     *      a new series.
     */
    function fractionalize(uint256 nftId, uint256 tonnage) external nonReentrant returns (address tokenAddr) {
        require(tonnage > 0, "Fractionalizer: zero tonnage");
        require(lockedTonnage[nftId] == 0, "Fractionalizer: already active");

        // Deploy fraction token on first fractionalization for this id.
        tokenAddr = fractionToken[nftId];
        if (tokenAddr == address(0)) {
            (uint8 grade, uint16 vintage, , , , ) = nftMeta.meta(nftId);
            string memory gradeStr = grade == 0 ? "A" : grade == 1 ? "B" : grade == 2 ? "C" : "D";
            string memory name = string(
                abi.encodePacked(
                    "CCM Frac #",
                    nftId.toString(),
                    " (Grade ",
                    gradeStr,
                    " ",
                    uint256(vintage).toString(),
                    ")"
                )
            );
            string memory symbol = string(abi.encodePacked("FRAC", nftId.toString()));
            tokenAddr = address(new CCMFractionToken(name, symbol, address(this)));
            fractionToken[nftId] = tokenAddr;
        }

        // EFFECTS
        lockedTonnage[nftId] = tonnage;
        totalActiveSeries++;

        // INTERACTIONS
        nft.safeTransferFrom(msg.sender, address(this), nftId, tonnage, "");
        CCMFractionToken(tokenAddr).mint(msg.sender, tonnage * TOKEN_PER_TONNE);

        emit Fractionalized(nftId, tokenAddr, msg.sender, tonnage);
    }

    /**
     * @notice Burn the full circulating fraction supply and reclaim the NFT.
     * @dev Caller must hold the full set; partial reassembly is not allowed.
     */
    function reassemble(uint256 nftId) external nonReentrant {
        uint256 locked = lockedTonnage[nftId];
        require(locked > 0, "Fractionalizer: not active");
        address tok = fractionToken[nftId];
        // Should always be non-zero when locked > 0, but guard anyway:
        require(tok != address(0), "Fractionalizer: token missing");

        uint256 needed = locked * TOKEN_PER_TONNE;
        require(
            CCMFractionToken(tok).balanceOf(msg.sender) >= needed,
            "Fractionalizer: hold full set to reassemble"
        );

        // EFFECTS
        lockedTonnage[nftId] = 0;
        totalActiveSeries--;

        // INTERACTIONS
        CCMFractionToken(tok).burnFromMinter(msg.sender, needed);
        nft.safeTransferFrom(address(this), msg.sender, nftId, locked, "");

        emit Reassembled(nftId, msg.sender, locked);
    }

    /// @notice True if NFT id has an active fraction series.
    function isActive(uint256 nftId) external view returns (bool) {
        return lockedTonnage[nftId] > 0;
    }
}
