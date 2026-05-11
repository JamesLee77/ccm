// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCM Basket Token (TESTNET ONLY)
 * @notice Minimal ERC-20 emitted by `CCMSandboxIndexBasket`. Single trusted
 *         minter pattern (same as CCMGradeToken §7.3, CCMFractionToken §7.5).
 */
contract CCMBasketToken is ERC20 {
    address public immutable minter;

    constructor(string memory name_, string memory symbol_, address minter_) ERC20(name_, symbol_) {
        require(minter_ != address(0), "BasketToken: zero minter");
        minter = minter_;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "BasketToken: not minter");
        _mint(to, amount);
    }

    function burnFromMinter(address account, uint256 amount) external {
        require(msg.sender == minter, "BasketToken: not minter");
        _burn(account, amount);
    }
}

/**
 * @title CCM Sandbox Index Basket (TESTNET ONLY) — §7.8
 * @notice Three curated basket tokens that bundle exposure to multiple
 *         grade-specific $CCM tokens at fixed weights:
 *           - $CCM-PRIME  (top-grade weighted): A 60% / B 30% / C 10% / D 0%
 *           - $CCM-FOREST (nature-based)      : A  0% / B 30% / C 60% / D 10%
 *           - $CCM-TECH   (engineered removal): A 70% / B 30% / C  0% / D 0%
 *
 *         Mint deposits grade tokens at weights, returns basket tokens.
 *         Redeem burns basket tokens, returns underlying grade tokens.
 *         The carbon-market analogue of a passive ETF.
 *
 * @dev SAFETY:
 *   - Sandbox-only. Constructor refuses chainId 8453.
 *   - Trustless: each basket holds exactly the grade tokens deposited
 *     into it; redemption is always pro-rata.
 *   - Minter pattern on basket tokens means no allowance is needed for
 *     redeem (the basket contract is the only burner).
 *   - SafeERC20 for grade-token transfers.
 *   - ReentrancyGuard.
 */
contract CCMSandboxIndexBasket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint8 public constant GRADE_COUNT = 4;
    uint8 public constant BASKET_COUNT = 3;
    uint16 public constant BPS_DENOMINATOR = 10_000;

    /// @notice [A, B, C, D] grade-token addresses. Set at construction.
    address[GRADE_COUNT] public gradeTokens;

    struct Basket {
        CCMBasketToken token;
        uint16[GRADE_COUNT] weights; // bps, sum to 10_000
    }

    Basket[BASKET_COUNT] public baskets;

    event BasketMinted(uint8 indexed basketIdx, address indexed user, uint256 amount);
    event BasketRedeemed(uint8 indexed basketIdx, address indexed user, uint256 amount);

    constructor(address[GRADE_COUNT] memory gradeTokens_) {
        require(block.chainid != 8453, "Basket: refuse mainnet");
        for (uint8 g = 0; g < GRADE_COUNT; g++) {
            require(gradeTokens_[g] != address(0), "Basket: zero grade token");
            gradeTokens[g] = gradeTokens_[g];
        }

        // Deploy three basket tokens, each with the wrapper as immutable minter.
        baskets[0] = Basket({
            token: new CCMBasketToken("CCM PRIME (testnet)", "CCM-PRIME", address(this)),
            weights: [uint16(6000), uint16(3000), uint16(1000), uint16(0)]
        });
        baskets[1] = Basket({
            token: new CCMBasketToken("CCM FOREST (testnet)", "CCM-FOREST", address(this)),
            weights: [uint16(0), uint16(3000), uint16(6000), uint16(1000)]
        });
        baskets[2] = Basket({
            token: new CCMBasketToken("CCM TECH (testnet)", "CCM-TECH", address(this)),
            weights: [uint16(7000), uint16(3000), uint16(0), uint16(0)]
        });

        // Sanity check: each basket's weights sum to BPS_DENOMINATOR
        for (uint8 b = 0; b < BASKET_COUNT; b++) {
            uint256 sum;
            for (uint8 g = 0; g < GRADE_COUNT; g++) sum += baskets[b].weights[g];
            require(sum == BPS_DENOMINATOR, "Basket: weights sum != 10000");
        }
    }

    /**
     * @notice Mint `basketAtoms` of basket `basketIdx`. Pulls
     *         `basketAtoms × weight[g] / 10_000` of each grade token from
     *         caller, then mints `basketAtoms` of the basket ERC-20.
     * @dev Caller must `approve(this, …)` on each grade token first.
     */
    function mint(uint8 basketIdx, uint256 basketAtoms) external nonReentrant {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        require(basketAtoms > 0, "Basket: zero amount");
        Basket storage b = baskets[basketIdx];

        for (uint8 g = 0; g < GRADE_COUNT; g++) {
            uint16 w = b.weights[g];
            if (w == 0) continue;
            uint256 needed = (basketAtoms * uint256(w)) / BPS_DENOMINATOR;
            if (needed > 0) {
                IERC20(gradeTokens[g]).safeTransferFrom(msg.sender, address(this), needed);
            }
        }
        b.token.mint(msg.sender, basketAtoms);
        emit BasketMinted(basketIdx, msg.sender, basketAtoms);
    }

    /**
     * @notice Burn `basketAtoms` of basket `basketIdx`, return weighted grade
     *         tokens to caller.
     * @dev No grade-token approval needed for redeem; basket holds them.
     *      No basket-token approval needed either (trusted-minter burn).
     */
    function redeem(uint8 basketIdx, uint256 basketAtoms) external nonReentrant {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        require(basketAtoms > 0, "Basket: zero amount");
        Basket storage b = baskets[basketIdx];

        b.token.burnFromMinter(msg.sender, basketAtoms);

        for (uint8 g = 0; g < GRADE_COUNT; g++) {
            uint16 w = b.weights[g];
            if (w == 0) continue;
            uint256 give = (basketAtoms * uint256(w)) / BPS_DENOMINATOR;
            if (give > 0) {
                IERC20(gradeTokens[g]).safeTransfer(msg.sender, give);
            }
        }
        emit BasketRedeemed(basketIdx, msg.sender, basketAtoms);
    }

    // --- View helpers ---

    /// @notice Address of the basket ERC-20.
    function tokenOf(uint8 basketIdx) external view returns (address) {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        return address(baskets[basketIdx].token);
    }

    /// @notice Per-grade weight (bps) of basket `basketIdx`. Returns array [A, B, C, D].
    function weightsOf(uint8 basketIdx) external view returns (uint16[GRADE_COUNT] memory) {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        return baskets[basketIdx].weights;
    }

    /// @notice Compute grade-token amount required to mint `basketAtoms` of basket.
    function quoteMint(uint8 basketIdx, uint256 basketAtoms)
        external
        view
        returns (uint256[GRADE_COUNT] memory needs)
    {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        Basket storage b = baskets[basketIdx];
        for (uint8 g = 0; g < GRADE_COUNT; g++) {
            needs[g] = (basketAtoms * uint256(b.weights[g])) / BPS_DENOMINATOR;
        }
    }

    /// @notice Compute grade-token amount returned by redeeming `basketAtoms`.
    function quoteRedeem(uint8 basketIdx, uint256 basketAtoms)
        external
        view
        returns (uint256[GRADE_COUNT] memory gives)
    {
        require(basketIdx < BASKET_COUNT, "Basket: bad basket");
        Basket storage b = baskets[basketIdx];
        for (uint8 g = 0; g < GRADE_COUNT; g++) {
            gives[g] = (basketAtoms * uint256(b.weights[g])) / BPS_DENOMINATOR;
        }
    }
}
