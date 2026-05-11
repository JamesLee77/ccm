// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
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

/**
 * @title CCM Grade Token (TESTNET ONLY)
 * @notice Minimal ERC-20 emitted by `CCMSandboxGradeWrapper`. Single trusted
 *         minter (the wrapper itself). No admin, no pause, no upgradability.
 *
 * @dev The wrapper is the only contract that can mint or burn this token.
 *      Users do NOT need to approve the wrapper for burns — `unwrap` is
 *      user-initiated, so the wrapper acts on the caller's explicit
 *      authorization in that single tx. Trusted-minter pattern.
 */
contract CCMGradeToken is ERC20 {
    address public immutable minter;

    constructor(string memory name_, string memory symbol_, address minter_) ERC20(name_, symbol_) {
        require(minter_ != address(0), "GradeToken: zero minter");
        minter = minter_;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "GradeToken: not minter");
        _mint(to, amount);
    }

    function burnFromMinter(address account, uint256 amount) external {
        require(msg.sender == minter, "GradeToken: not minter");
        _burn(account, amount);
    }
}

/**
 * @title CCM Sandbox Grade Wrapper (TESTNET ONLY) — §7.3
 * @notice Per-grade wrap variant. Wraps a CCMSandboxNFT batch into the
 *         grade-specific ERC-20 ($CCM-A / B / C / D) so buyers can hold
 *         pure-grade exposure rather than the blended pool of §7.2.
 *
 * Architecture:
 *   - Constructor deploys 4 CCMGradeToken instances (A/B/C/D) it owns mint+burn on.
 *   - `wrap(id, tonnage)` reads grade from the NFT, holds the NFT, mints
 *     `tonnage * 10^18` of the matching grade token to caller.
 *   - `unwrap(grade, ccmAmount)` burns from caller's grade-X balance and
 *     returns NFTs of grade X (FIFO within grade, no cross-grade redemption).
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - 1:1 invariant by construction per grade.
 *   - Per-tx hop cap on unwrap; split larger redemptions.
 *   - ReentrancyGuard + CEI ordering.
 */
contract CCMSandboxGradeWrapper is ERC1155Holder, ReentrancyGuard {
    IERC1155 public immutable nft;
    ISandboxNFTMeta public immutable nftMeta;

    /// @notice One ERC-20 per grade. gradeTokens[0]=A, [1]=B, [2]=C, [3]=D.
    CCMGradeToken[4] public gradeTokens;

    uint8 public constant GRADE_COUNT = 4;
    uint256 public constant MAX_HOPS_PER_UNWRAP = 5;
    uint256 public constant TOKEN_PER_TONNE = 1e18;

    struct Entry {
        uint256 id;
        uint256 amount; // tonnes
    }

    mapping(uint8 => mapping(uint256 => Entry)) private queue;
    mapping(uint8 => uint256) public queueHead;
    mapping(uint8 => uint256) public queueTail;
    /// @notice Tonnes locked per grade (matches sum of grade-token totalSupply / 1e18).
    mapping(uint8 => uint256) public gradeBalance;
    mapping(uint8 => uint256) public totalWrapped;
    mapping(uint8 => uint256) public totalUnwrapped;

    event Wrapped(address indexed user, uint256 indexed nftId, uint8 indexed grade, uint256 tonnage);
    event Unwrapped(address indexed user, uint256 indexed nftId, uint8 indexed grade, uint256 tonnage);

    constructor(address nft_) {
        require(block.chainid != 8453, "GradeWrapper: refuse mainnet");
        require(nft_ != address(0), "GradeWrapper: zero nft");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
        // Deploy 4 grade tokens. The wrapper is the immutable minter for each.
        gradeTokens[0] = new CCMGradeToken("CCM Grade A (testnet)", "CCM-A", address(this));
        gradeTokens[1] = new CCMGradeToken("CCM Grade B (testnet)", "CCM-B", address(this));
        gradeTokens[2] = new CCMGradeToken("CCM Grade C (testnet)", "CCM-C", address(this));
        gradeTokens[3] = new CCMGradeToken("CCM Grade D (testnet)", "CCM-D", address(this));
    }

    /**
     * @notice Wrap `tonnage` units of NFT id into the grade-specific token.
     *         Grade is read from nft.meta(id). User must
     *         setApprovalForAll(this, true) on the NFT contract first.
     */
    function wrap(uint256 id, uint256 tonnage) external nonReentrant {
        require(tonnage > 0, "GradeWrapper: zero amount");
        (uint8 grade, , , , , ) = nftMeta.meta(id);
        require(grade < GRADE_COUNT, "GradeWrapper: bad grade");

        // EFFECTS
        uint256 idx = queueTail[grade];
        queue[grade][idx] = Entry({id: id, amount: tonnage});
        queueTail[grade] = idx + 1;
        gradeBalance[grade] += tonnage;
        totalWrapped[grade] += tonnage;

        // INTERACTIONS
        nft.safeTransferFrom(msg.sender, address(this), id, tonnage, "");
        gradeTokens[grade].mint(msg.sender, tonnage * TOKEN_PER_TONNE);

        emit Wrapped(msg.sender, id, grade, tonnage);
    }

    /**
     * @notice Unwrap `ccmAmount` of grade-X token, returning grade-X NFTs
     *         from the FIFO queue. No cross-grade redemption.
     * @dev No allowance step required: the wrapper is the trusted minter
     *      of grade tokens and is the only contract that can burn them.
     *      The caller is the explicit authorizer of this tx.
     */
    function unwrap(uint8 grade, uint256 ccmAmount) external nonReentrant {
        require(grade < GRADE_COUNT, "GradeWrapper: bad grade");
        require(ccmAmount > 0, "GradeWrapper: zero amount");
        require(ccmAmount % TOKEN_PER_TONNE == 0, "GradeWrapper: must be whole tonnes");

        // INTERACTION: burn first (reverts if caller has insufficient grade-X balance)
        gradeTokens[grade].burnFromMinter(msg.sender, ccmAmount);

        uint256 remaining = ccmAmount / TOKEN_PER_TONNE;
        uint256 head = queueHead[grade];
        uint256 tail = queueTail[grade];
        uint256 hops;

        while (head < tail && remaining > 0) {
            require(hops < MAX_HOPS_PER_UNWRAP, "GradeWrapper: too many hops, split unwrap");
            Entry storage e = queue[grade][head];
            uint256 take = e.amount < remaining ? e.amount : remaining;

            // EFFECTS
            remaining -= take;
            gradeBalance[grade] -= take;
            totalUnwrapped[grade] += take;

            uint256 returnedId = e.id;
            if (e.amount == take) {
                delete queue[grade][head];
                head++;
            } else {
                e.amount -= take;
            }
            hops++;

            // INTERACTION
            nft.safeTransferFrom(address(this), msg.sender, returnedId, take, "");
            emit Unwrapped(msg.sender, returnedId, grade, take);
        }
        queueHead[grade] = head;
        require(remaining == 0, "GradeWrapper: insufficient tonnes in vault");
    }

    /// @notice Address of the grade-X ERC-20.
    function tokenOf(uint8 grade) external view returns (address) {
        require(grade < GRADE_COUNT, "GradeWrapper: bad grade");
        return address(gradeTokens[grade]);
    }

    /// @notice Number of pending entries in queue[grade].
    function queueLength(uint8 grade) external view returns (uint256) {
        require(grade < GRADE_COUNT, "GradeWrapper: bad grade");
        return queueTail[grade] - queueHead[grade];
    }

    /// @notice Inspect a specific entry by absolute index (head-based).
    function queueEntry(uint8 grade, uint256 index) external view returns (uint256 id, uint256 amount) {
        require(grade < GRADE_COUNT, "GradeWrapper: bad grade");
        Entry storage e = queue[grade][index];
        return (e.id, e.amount);
    }
}
