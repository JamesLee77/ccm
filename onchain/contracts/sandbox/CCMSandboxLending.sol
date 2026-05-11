// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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
 * @title CCM Sandbox Lending (TESTNET ONLY) — §7.4
 * @notice Carbon-collateralized loans. Pledge a CCMSandboxNFT batch,
 *         borrow CCMSandboxUSDC up to a grade-tiered LTV.
 *
 * Per-grade params (sandbox):
 *   Grade A · DAC · 1000+ yr permanence  → $50 / tonne · 70% LTV → $35 max/tonne
 *   Grade B · biochar · 100+ yr           → $30 / tonne · 60% LTV → $18 max/tonne
 *   Grade C · reforestation · 40+ yr      → $15 / tonne · 45% LTV → $6.75 max/tonne
 *   Grade D · REDD+ · 10–40 yr            → $5  / tonne · 30% LTV → $1.50 max/tonne
 *
 * Lifecycle:
 *   open(id, tonnage, borrow):
 *     - require borrow ≤ maxBorrow(grade, tonnage)
 *     - vault holds NFT, transfers USDC out
 *     - position recorded
 *   close(positionId):
 *     - borrower repays full borrow → NFT returned
 *   liquidate(positionId):
 *     - sandbox: simple 30-day expiry (real protocol: oracle drop / Dutch auction)
 *     - liquidator pays full borrow, takes NFT
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - SafeERC20 for USDC ops.
 *   - Per-position state tracking; positions are array-indexed and immutable
 *     once created (only the collateral-amount/borrowed fields are zeroed
 *     on close/liquidate).
 *   - ReentrancyGuard on all external state mutators.
 */
contract CCMSandboxLending is ERC1155Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC1155 public immutable nft;
    ISandboxNFTMeta public immutable nftMeta;
    IERC20 public immutable usdc;

    uint8 public constant GRADE_COUNT = 4;
    uint256 public constant LIQUIDATION_AFTER = 30 days;

    struct GradeParams {
        uint256 pricePerTonne; // raw USDC (6 decimals)
        uint16 ltvBps;         // out of 10_000
    }

    /// @notice [A, B, C, D] sandbox parameters. Immutable for the lifetime of the deploy.
    GradeParams[4] public gradeParams;

    enum PositionStatus {
        Open,
        Closed,
        Liquidated
    }

    struct Position {
        address borrower;
        uint256 nftId;
        uint256 nftAmount; // tonnes
        uint8 grade;
        uint256 borrowed;  // raw USDC
        uint64 openedAt;
        PositionStatus status;
    }

    Position[] public positions;
    mapping(address => uint256[]) private _userPositions;
    uint256 public totalBorrowed;
    uint256 public totalRepaid;

    event Opened(
        uint256 indexed positionId,
        address indexed borrower,
        uint256 nftId,
        uint8 indexed grade,
        uint256 tonnage,
        uint256 borrowed
    );
    event Closed(uint256 indexed positionId, address indexed borrower, uint256 repaid);
    event Liquidated(uint256 indexed positionId, address indexed liquidator);

    constructor(address nft_, address usdc_) {
        require(block.chainid != 8453, "Lending: refuse mainnet");
        require(nft_ != address(0) && usdc_ != address(0), "Lending: zero addr");
        nft = IERC1155(nft_);
        nftMeta = ISandboxNFTMeta(nft_);
        usdc = IERC20(usdc_);

        // Hard-coded sandbox parameters (per whitepaper §7.4).
        gradeParams[0] = GradeParams({pricePerTonne: 50 * 10**6, ltvBps: 7000}); // A
        gradeParams[1] = GradeParams({pricePerTonne: 30 * 10**6, ltvBps: 6000}); // B
        gradeParams[2] = GradeParams({pricePerTonne: 15 * 10**6, ltvBps: 4500}); // C
        gradeParams[3] = GradeParams({pricePerTonne: 5  * 10**6, ltvBps: 3000}); // D
    }

    /// @notice Maximum USDC borrowable for `tonnage` tonnes of `grade`.
    function maxBorrow(uint8 grade, uint256 tonnage) public view returns (uint256) {
        require(grade < GRADE_COUNT, "Lending: bad grade");
        GradeParams memory p = gradeParams[grade];
        return (tonnage * p.pricePerTonne * uint256(p.ltvBps)) / 10_000;
    }

    /**
     * @notice Open a lending position.
     * @dev Caller must `nft.setApprovalForAll(this, true)` first.
     */
    function open(
        uint256 id,
        uint256 tonnage,
        uint256 borrowAmount
    ) external nonReentrant returns (uint256 positionId) {
        require(tonnage > 0, "Lending: zero tonnage");
        require(borrowAmount > 0, "Lending: zero borrow");

        (uint8 grade, , , , , ) = nftMeta.meta(id);
        require(grade < GRADE_COUNT, "Lending: bad grade");

        uint256 max = maxBorrow(grade, tonnage);
        require(borrowAmount <= max, "Lending: borrow > LTV cap");
        require(usdc.balanceOf(address(this)) >= borrowAmount, "Lending: insufficient reserves");

        positionId = positions.length;
        positions.push(
            Position({
                borrower: msg.sender,
                nftId: id,
                nftAmount: tonnage,
                grade: grade,
                borrowed: borrowAmount,
                openedAt: uint64(block.timestamp),
                status: PositionStatus.Open
            })
        );
        _userPositions[msg.sender].push(positionId);
        totalBorrowed += borrowAmount;

        // INTERACTIONS: pull NFT, then send USDC.
        nft.safeTransferFrom(msg.sender, address(this), id, tonnage, "");
        usdc.safeTransfer(msg.sender, borrowAmount);

        emit Opened(positionId, msg.sender, id, grade, tonnage, borrowAmount);
    }

    /**
     * @notice Repay the loan and reclaim the NFT.
     * @dev Caller must `usdc.approve(this, borrowed)` first.
     */
    function close(uint256 positionId) external nonReentrant {
        Position storage p = positions[positionId];
        require(p.status == PositionStatus.Open, "Lending: not open");
        require(p.borrower == msg.sender, "Lending: not borrower");

        uint256 repay = p.borrowed;
        uint256 id = p.nftId;
        uint256 amount = p.nftAmount;

        // EFFECTS first
        p.status = PositionStatus.Closed;
        totalRepaid += repay;

        // INTERACTIONS
        usdc.safeTransferFrom(msg.sender, address(this), repay);
        nft.safeTransferFrom(address(this), msg.sender, id, amount, "");

        emit Closed(positionId, msg.sender, repay);
    }

    /**
     * @notice Liquidate an expired position.
     * @dev Sandbox heuristic: any position not closed within 30 days of
     *      opening can be liquidated by anyone. The liquidator pays the
     *      outstanding borrow and receives the NFT collateral. Real
     *      protocol uses oracle price + Dutch auction.
     */
    function liquidate(uint256 positionId) external nonReentrant {
        Position storage p = positions[positionId];
        require(p.status == PositionStatus.Open, "Lending: not open");
        require(
            block.timestamp >= uint256(p.openedAt) + LIQUIDATION_AFTER,
            "Lending: not yet liquidatable"
        );

        uint256 repay = p.borrowed;
        uint256 id = p.nftId;
        uint256 amount = p.nftAmount;

        // EFFECTS
        p.status = PositionStatus.Liquidated;
        totalRepaid += repay;

        // INTERACTIONS
        usdc.safeTransferFrom(msg.sender, address(this), repay);
        nft.safeTransferFrom(address(this), msg.sender, id, amount, "");

        emit Liquidated(positionId, msg.sender);
    }

    /// @notice Number of positions ever opened (for indexing).
    function positionCount() external view returns (uint256) {
        return positions.length;
    }

    /// @notice User's position ids.
    function userPositionsOf(address user) external view returns (uint256[] memory) {
        return _userPositions[user];
    }

    /// @notice Reserve balance available for new borrows.
    function reserves() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
